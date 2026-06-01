import {
  MergeRequest,
  MergeResult,
  MergePreview,
  MergeConflict,
  FieldSelection,
  FieldAlternative,
  MergeOptions,
  MergeAuditLog,
  RollbackRequest,
  RollbackResult,
  DEFAULT_MERGE_OPTIONS,
  MERGEABLE_FIELDS,
  REQUIRED_FIELDS,
  FIELD_LABELS,
  MERGE_UNDO_WINDOW
} from '../types/duplicateDetection';

export class ProspectMergeService {
  private static instance: ProspectMergeService;

  private constructor() {}

  static getInstance(): ProspectMergeService {
    if (!ProspectMergeService.instance) {
      ProspectMergeService.instance = new ProspectMergeService();
    }
    return ProspectMergeService.instance;
  }

  async createMergePreview(
    masterProspectId: string,
    duplicateProspectIds: string[],
    fieldSelections?: FieldSelection[]
  ): Promise<MergePreview> {
    const master = await this.getProspect(masterProspectId);
    const duplicates = await Promise.all(
      duplicateProspectIds.map(id => this.getProspect(id))
    );

    const allProspects = [master, ...duplicates];
    const conflicts = this.detectConflicts(allProspects);
    const mergedData = this.buildMergedData(master, duplicates, fieldSelections);
    const warnings = this.generateWarnings(master, duplicates, mergedData);

    const activityCount = allProspects.reduce((sum, p) => sum + (p.activityCount || 0), 0);
    const tagsCount = allProspects.reduce((sum, p) => sum + (p.tags?.length || 0), 0);
    const notesCount = allProspects.reduce((sum, p) => sum + (p.notes?.length || 0), 0);

    return {
      masterProspect: this.toProspectSummary(master),
      mergedData,
      conflicts,
      warnings,
      activityCount,
      tagsCount,
      notesCount,
      referencesCount: 0
    };
  }

  async executeMerge(
    masterProspectId: string,
    duplicateProspectIds: string[],
    fieldSelections: FieldSelection[],
    options: MergeOptions = DEFAULT_MERGE_OPTIONS
  ): Promise<MergeResult> {
    try {
      const master = await this.getProspect(masterProspectId);
      const duplicates = await Promise.all(
        duplicateProspectIds.map(id => this.getProspect(id))
      );

      // Create audit log before merge
      const auditLog = await this.createAuditLog(
        masterProspectId,
        duplicateProspectIds,
        master,
        duplicates
      );

      // Build merged data
      const mergedData = this.applyFieldSelections(master, fieldSelections);

      // Merge activities
      let activityMergeCount = 0;
      if (options.preserveActivities) {
        activityMergeCount = await this.mergeActivities(masterProspectId, duplicateProspectIds);
      }

      // Merge tags
      let tagsMergeCount = 0;
      if (options.combineTags) {
        tagsMergeCount = await this.mergeTags(master, duplicates);
      }

      // Merge notes
      let notesMergeCount = 0;
      if (options.mergeNotes) {
        notesMergeCount = await this.mergeNotes(masterProspectId, duplicateProspectIds);
      }

      // Update references
      let updatedReferences = 0;
      if (options.updateReferences) {
        updatedReferences = await this.updateReferences(masterProspectId, duplicateProspectIds);
      }

      // Archive or delete duplicates
      const archivedProspectIds: string[] = [];
      if (options.archiveDuplicates) {
        await this.archiveProspects(duplicateProspectIds);
        archivedProspectIds.push(...duplicateProspectIds);
      } else if (options.deleteDuplicates) {
        await this.deleteProspects(duplicateProspectIds);
        archivedProspectIds.push(...duplicateProspectIds);
      }

      // Update master prospect
      await this.updateProspect(masterProspectId, mergedData);

      // Notify owners
      if (options.notifyOwners) {
        await this.notifyProspectOwners(master, duplicates);
      }

      const now = new Date().toISOString();
      const undoExpiresAt = new Date(Date.now() + MERGE_UNDO_WINDOW).toISOString();

      return {
        success: true,
        mergedProspectId: masterProspectId,
        mergedFields: fieldSelections.length,
        archivedProspectIds,
        activityMergeCount,
        tagsMergeCount,
        notesMergeCount,
        updatedReferences,
        timestamp: now,
        auditLogId: auditLog.id,
        canUndo: true,
        undoExpiresAt
      };
    } catch (error) {
      return {
        success: false,
        mergedProspectId: masterProspectId,
        mergedFields: 0,
        archivedProspectIds: [],
        activityMergeCount: 0,
        tagsMergeCount: 0,
        notesMergeCount: 0,
        updatedReferences: 0,
        timestamp: new Date().toISOString(),
        auditLogId: '',
        canUndo: false
      };
    }
  }

  async rollbackMerge(request: RollbackRequest): Promise<RollbackResult> {
    try {
      const auditLog = await this.getAuditLog(request.mergeAuditLogId);

      if (!auditLog.canRollback) {
        return {
          success: false,
          restoredProspectIds: [],
          error: 'Merge cannot be rolled back (expired or already rolled back)',
          timestamp: new Date().toISOString()
        };
      }

      // Restore master prospect to previous state
      await this.updateProspect(auditLog.masterProspectId, auditLog.beforeSnapshot);

      // Restore archived/deleted duplicates
      const restoredIds = await this.restoreProspects(auditLog.duplicateProspectIds);

      // Update audit log
      await this.markAsRolledBack(request.mergeAuditLogId, request.requestedBy);

      return {
        success: true,
        restoredProspectIds: restoredIds,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        restoredProspectIds: [],
        error: 'Failed to rollback merge',
        timestamp: new Date().toISOString()
      };
    }
  }

  generateFieldSelections(prospects: any[]): FieldSelection[] {
    const selections: FieldSelection[] = [];

    MERGEABLE_FIELDS.forEach(field => {
      const alternatives: FieldAlternative[] = prospects.map(p => ({
        prospectId: p.id,
        value: p[field],
        dataQualityScore: p.dataQualityScore || 0,
        source: p.source || 'manual',
        lastUpdated: p.updatedAt || p.createdAt,
        isVerified: p.verifiedFields?.includes(field) || false
      }));

      // Auto-select best value
      const bestAlternative = this.selectBestAlternative(alternatives, field);
      const hasConflict = this.hasConflict(alternatives);

      selections.push({
        field,
        selectedProspectId: bestAlternative.prospectId,
        selectedValue: bestAlternative.value,
        alternatives,
        hasConflict,
        autoSelected: true
      });
    });

    return selections;
  }

  private detectConflicts(prospects: any[]): MergeConflict[] {
    const conflicts: MergeConflict[] = [];

    MERGEABLE_FIELDS.forEach(field => {
      const values = prospects
        .map(p => p[field])
        .filter(v => v !== null && v !== undefined && v !== '');

      const uniqueValues = Array.from(new Set(values));

      if (uniqueValues.length > 1) {
        const conflictValues = prospects.map(p => ({
          prospectId: p.id,
          prospectName: `${p.firstName} ${p.lastName}`,
          value: p[field],
          displayValue: this.formatValue(p[field]),
          dataQualityScore: p.dataQualityScore || 0,
          isVerified: p.verifiedFields?.includes(field) || false,
          lastUpdated: p.updatedAt || p.createdAt,
          source: p.source || 'manual'
        }));

        const suggestion = this.generateConflictSuggestion(conflictValues, field);
        const severity = REQUIRED_FIELDS.includes(field) ? 'high' : 'medium';

        conflicts.push({
          field,
          label: FIELD_LABELS[field] || field,
          values: conflictValues,
          suggestion,
          severity
        });
      }
    });

    return conflicts;
  }

  private selectBestAlternative(alternatives: FieldAlternative[], field: string): FieldAlternative {
    const validAlternatives = alternatives.filter(a => a.value);

    if (validAlternatives.length === 0) {
      return alternatives[0];
    }

    // Prioritize verified values
    const verified = validAlternatives.find(a => a.isVerified);
    if (verified) return verified;

    // Prioritize by data quality score
    const sorted = validAlternatives.sort((a, b) => {
      if (b.dataQualityScore !== a.dataQualityScore) {
        return b.dataQualityScore - a.dataQualityScore;
      }
      // If scores are equal, use most recent
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });

    return sorted[0];
  }

  private hasConflict(alternatives: FieldAlternative[]): boolean {
    const values = alternatives
      .map(a => a.value)
      .filter(v => v !== null && v !== undefined && v !== '');
    return new Set(values).size > 1;
  }

  private generateConflictSuggestion(values: any[], field: string): string {
    const verified = values.find(v => v.isVerified);
    if (verified) {
      return `${FIELD_LABELS[field]} from ${verified.prospectName} is verified`;
    }

    const bestQuality = values.reduce((best, current) =>
      current.dataQualityScore > best.dataQualityScore ? current : best
    );

    return `${FIELD_LABELS[field]} from ${bestQuality.prospectName} has highest quality score`;
  }

  private buildMergedData(
    master: any,
    duplicates: any[],
    fieldSelections?: FieldSelection[]
  ): Record<string, any> {
    const merged = { ...master };

    if (fieldSelections) {
      fieldSelections.forEach(selection => {
        merged[selection.field] = selection.selectedValue;
      });
    }

    return merged;
  }

  private applyFieldSelections(master: any, selections: FieldSelection[]): Record<string, any> {
    const merged = { ...master };
    selections.forEach(selection => {
      merged[selection.field] = selection.selectedValue;
    });
    return merged;
  }

  private generateWarnings(master: any, duplicates: any[], mergedData: any): string[] {
    const warnings: string[] = [];

    REQUIRED_FIELDS.forEach(field => {
      if (!mergedData[field]) {
        warnings.push(`Required field ${FIELD_LABELS[field]} is missing`);
      }
    });

    const totalActivities = [master, ...duplicates].reduce(
      (sum, p) => sum + (p.activityCount || 0), 0
    );
    if (totalActivities > 100) {
      warnings.push(`Merging ${totalActivities} activities may take a few moments`);
    }

    return warnings;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  private async getProspect(id: string): Promise<any> {
    // Mock - in production, fetch from Supabase
    return {
      id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      companyName: 'Acme Corp',
      jobTitle: 'Sales Manager',
      createdAt: '2024-01-15',
      activityCount: 25,
      dataQualityScore: 85,
      tags: ['hot-lead', 'enterprise'],
      notes: ['Initial contact made', 'Interested in product']
    };
  }

  private toProspectSummary(prospect: any): any {
    return {
      id: prospect.id,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone,
      companyName: prospect.companyName,
      jobTitle: prospect.jobTitle,
      createdAt: prospect.createdAt,
      activityCount: prospect.activityCount || 0,
      dataQualityScore: prospect.dataQualityScore || 0
    };
  }

  private async createAuditLog(
    masterId: string,
    duplicateIds: string[],
    master: any,
    duplicates: any[]
  ): Promise<MergeAuditLog> {
    return {
      id: `audit-${Date.now()}`,
      mergeRequestId: `merge-${Date.now()}`,
      masterProspectId: masterId,
      duplicateProspectIds: duplicateIds,
      performedBy: 'current-user',
      performedAt: new Date().toISOString(),
      fieldChanges: [],
      beforeSnapshot: master,
      afterSnapshot: {},
      status: 'completed',
      canRollback: true,
      rollbackExpiresAt: new Date(Date.now() + MERGE_UNDO_WINDOW).toISOString()
    };
  }

  private async mergeActivities(masterId: string, duplicateIds: string[]): Promise<number> {
    // In production, update activity records in Supabase
    return duplicateIds.length * 10;
  }

  private async mergeTags(master: any, duplicates: any[]): Promise<number> {
    const allTags = new Set([...(master.tags || [])]);
    duplicates.forEach(d => {
      (d.tags || []).forEach((tag: string) => allTags.add(tag));
    });
    return allTags.size;
  }

  private async mergeNotes(masterId: string, duplicateIds: string[]): Promise<number> {
    return duplicateIds.length * 2;
  }

  private async updateReferences(masterId: string, duplicateIds: string[]): Promise<number> {
    return duplicateIds.length * 5;
  }

  private async archiveProspects(ids: string[]): Promise<void> {
    // In production, update Supabase records
  }

  private async deleteProspects(ids: string[]): Promise<void> {
    // In production, delete from Supabase
  }

  private async updateProspect(id: string, data: any): Promise<void> {
    // In production, update Supabase record
  }

  private async notifyProspectOwners(master: any, duplicates: any[]): Promise<void> {
    // In production, send notifications
  }

  private async getAuditLog(id: string): Promise<MergeAuditLog> {
    // Mock - in production, fetch from Supabase
    return {
      id,
      mergeRequestId: `merge-${Date.now()}`,
      masterProspectId: 'prospect-1',
      duplicateProspectIds: ['prospect-2'],
      performedBy: 'user-1',
      performedAt: new Date().toISOString(),
      fieldChanges: [],
      beforeSnapshot: {},
      afterSnapshot: {},
      status: 'completed',
      canRollback: true,
      rollbackExpiresAt: new Date(Date.now() + MERGE_UNDO_WINDOW).toISOString()
    };
  }

  private async restoreProspects(ids: string[]): Promise<string[]> {
    // In production, restore from archive in Supabase
    return ids;
  }

  private async markAsRolledBack(auditLogId: string, userId: string): Promise<void> {
    // In production, update audit log in Supabase
  }
}

export const prospectMergeService = ProspectMergeService.getInstance();
