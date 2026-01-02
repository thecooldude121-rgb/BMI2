import {
  DuplicateMatch,
  DuplicateGroup,
  ProspectSummary,
  MatchingField,
  MatchingRule,
  DuplicateConfidence,
  MATCHING_RULES,
  CONFIDENCE_THRESHOLDS
} from '../types/duplicateDetection';

export class DuplicateDetectionService {
  private static instance: DuplicateDetectionService;

  private constructor() {}

  static getInstance(): DuplicateDetectionService {
    if (!DuplicateDetectionService.instance) {
      DuplicateDetectionService.instance = new DuplicateDetectionService();
    }
    return DuplicateDetectionService.instance;
  }

  async detectDuplicatesForProspect(prospect: any): Promise<DuplicateMatch[]> {
    const matches: DuplicateMatch[] = [];

    // Simulate checking against existing prospects
    const existingProspects = await this.getAllProspects();

    for (const existing of existingProspects) {
      if (existing.id === prospect.id) continue;

      const matchResult = this.checkForMatch(prospect, existing);
      if (matchResult && matchResult.confidence >= 50) {
        matches.push({
          id: `match-${Date.now()}-${Math.random()}`,
          prospectId: prospect.id,
          duplicateProspectId: existing.id,
          confidence: matchResult.confidence,
          confidenceLevel: this.getConfidenceLevel(matchResult.confidence),
          matchingFields: matchResult.matchingFields,
          matchingRules: matchResult.matchingRules,
          detectedAt: new Date().toISOString(),
          detectedBy: 'automatic',
          status: 'active'
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  async findDuplicateGroups(): Promise<DuplicateGroup[]> {
    const prospects = await this.getAllProspects();
    const groups: Map<string, DuplicateGroup> = new Map();
    const processed = new Set<string>();

    for (let i = 0; i < prospects.length; i++) {
      if (processed.has(prospects[i].id)) continue;

      const duplicates: ProspectSummary[] = [prospects[i]];
      let totalConfidence = 0;
      let matchCount = 0;
      const allMatchingFields = new Set<string>();

      for (let j = i + 1; j < prospects.length; j++) {
        if (processed.has(prospects[j].id)) continue;

        const matchResult = this.checkForMatch(prospects[i], prospects[j]);
        if (matchResult && matchResult.confidence >= 70) {
          duplicates.push(prospects[j]);
          totalConfidence += matchResult.confidence;
          matchCount++;
          processed.add(prospects[j].id);

          matchResult.matchingFields.forEach(mf => allMatchingFields.add(mf.field));
        }
      }

      if (duplicates.length > 1) {
        const avgConfidence = matchCount > 0 ? totalConfidence / matchCount : 0;
        groups.set(`group-${i}`, {
          id: `group-${i}`,
          prospects: duplicates,
          confidence: Math.round(avgConfidence),
          confidenceLevel: this.getConfidenceLevel(avgConfidence),
          matchingFields: Array.from(allMatchingFields),
          detectedAt: new Date().toISOString(),
          matchCount: duplicates.length
        });
        processed.add(prospects[i].id);
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.confidence - a.confidence);
  }

  private checkForMatch(prospect1: any, prospect2: any): {
    confidence: number;
    matchingFields: MatchingField[];
    matchingRules: MatchingRule[];
  } | null {
    const matchingFields: MatchingField[] = [];
    const matchingRules: MatchingRule[] = [];
    let totalConfidence = 0;
    let ruleCount = 0;

    // Exact email match
    if (prospect1.email && prospect2.email &&
        prospect1.email.toLowerCase() === prospect2.email.toLowerCase()) {
      matchingFields.push({
        field: 'email',
        value1: prospect1.email,
        value2: prospect2.email,
        similarity: 100,
        matchType: 'exact'
      });
      matchingRules.push(MATCHING_RULES[0]);
      totalConfidence += 100;
      ruleCount++;
    }

    // LinkedIn URL match
    if (prospect1.linkedinUrl && prospect2.linkedinUrl &&
        this.normalizeUrl(prospect1.linkedinUrl) === this.normalizeUrl(prospect2.linkedinUrl)) {
      matchingFields.push({
        field: 'linkedinUrl',
        value1: prospect1.linkedinUrl,
        value2: prospect2.linkedinUrl,
        similarity: 100,
        matchType: 'exact'
      });
      matchingRules.push(MATCHING_RULES[1]);
      totalConfidence += 100;
      ruleCount++;
    }

    // Phone number match
    if (prospect1.phone && prospect2.phone &&
        this.normalizePhone(prospect1.phone) === this.normalizePhone(prospect2.phone)) {
      matchingFields.push({
        field: 'phone',
        value1: prospect1.phone,
        value2: prospect2.phone,
        similarity: 100,
        matchType: 'exact'
      });
      matchingRules.push(MATCHING_RULES[2]);
      totalConfidence += 95;
      ruleCount++;
    }

    // Name similarity
    const nameSimilarity = this.calculateNameSimilarity(
      `${prospect1.firstName} ${prospect1.lastName}`,
      `${prospect2.firstName} ${prospect2.lastName}`
    );

    // Name + Company match
    if (nameSimilarity >= 80 &&
        prospect1.companyName && prospect2.companyName &&
        prospect1.companyName.toLowerCase() === prospect2.companyName.toLowerCase()) {
      matchingFields.push({
        field: 'name',
        value1: `${prospect1.firstName} ${prospect1.lastName}`,
        value2: `${prospect2.firstName} ${prospect2.lastName}`,
        similarity: nameSimilarity,
        matchType: 'fuzzy'
      });
      matchingFields.push({
        field: 'companyName',
        value1: prospect1.companyName,
        value2: prospect2.companyName,
        similarity: 100,
        matchType: 'exact'
      });
      matchingRules.push(MATCHING_RULES[3]);
      totalConfidence += 90;
      ruleCount++;
    }

    // Name + Email Domain match
    if (nameSimilarity >= 80 &&
        prospect1.email && prospect2.email) {
      const domain1 = prospect1.email.split('@')[1];
      const domain2 = prospect2.email.split('@')[1];
      if (domain1 === domain2) {
        matchingFields.push({
          field: 'emailDomain',
          value1: domain1,
          value2: domain2,
          similarity: 100,
          matchType: 'exact'
        });
        matchingRules.push(MATCHING_RULES[4]);
        totalConfidence += 85;
        ruleCount++;
      }
    }

    if (ruleCount === 0) return null;

    const avgConfidence = totalConfidence / ruleCount;
    return {
      confidence: Math.round(avgConfidence),
      matchingFields,
      matchingRules
    };
  }

  calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();

    if (n1 === n2) return 100;

    const distance = this.levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return Math.round(similarity);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private getConfidenceLevel(confidence: number): DuplicateConfidence {
    if (confidence >= CONFIDENCE_THRESHOLDS.exact) return 'exact';
    if (confidence >= CONFIDENCE_THRESHOLDS.high) return 'high';
    if (confidence >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private normalizeUrl(url: string): string {
    return url.toLowerCase().replace(/\/$/, '').replace(/^https?:\/\//, '');
  }

  private async getAllProspects(): Promise<ProspectSummary[]> {
    // Mock data - in production, fetch from Supabase
    return [
      {
        id: 'prospect-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        companyName: 'Acme Corp',
        jobTitle: 'Sales Manager',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        createdAt: '2024-01-15',
        activityCount: 25,
        dataQualityScore: 85
      },
      {
        id: 'prospect-2',
        firstName: 'John',
        lastName: 'Doe',
        email: 'jdoe@example.com',
        phone: '5551234567',
        companyName: 'Acme Corp',
        jobTitle: 'Senior Sales Manager',
        createdAt: '2024-02-20',
        activityCount: 10,
        dataQualityScore: 75
      },
      {
        id: 'prospect-3',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@techcorp.com',
        companyName: 'Tech Corp',
        jobTitle: 'Marketing Director',
        createdAt: '2024-01-10',
        activityCount: 40,
        dataQualityScore: 95
      }
    ];
  }
}

export const duplicateDetectionService = DuplicateDetectionService.getInstance();
