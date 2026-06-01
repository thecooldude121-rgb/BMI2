// Sequence Service - Supabase Integration Layer
// Comprehensive service for managing email sequences, steps, enrollments, and analytics

import { supabase } from '../lib/supabase';
import {
  EmailSequence,
  SequenceStep,
  SequenceEnrollment,
  SequenceStepExecution,
  SequenceFilters,
  SequenceSortOptions,
  BulkEnrollmentRequest,
  BulkEnrollmentResult,
  SequencePerformanceMetrics,
  SequenceStepAnalytics,
  CloneSequenceOptions,
  SequenceValidationResult
} from '../types/sequences';

// =====================================================
// SEQUENCE CRUD OPERATIONS
// =====================================================

export const sequenceService = {
  /**
   * Get all sequences with optional filtering and sorting
   */
  async getSequences(
    filters?: SequenceFilters,
    sortOptions?: SequenceSortOptions,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      let query = supabase
        .from('email_sequences')
        .select(`
          *,
          steps:sequence_steps(count)
        `, { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.ownerId) {
          query = query.eq('owner_id', filters.ownerId);
        }
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags);
        }
        if (filters.folder) {
          query = query.eq('folder', filters.folder);
        }
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        if (filters.minOpenRate !== undefined) {
          query = query.gte('open_rate', filters.minOpenRate);
        }
        if (filters.minReplyRate !== undefined) {
          query = query.gte('reply_rate', filters.minReplyRate);
        }
        if (filters.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }
        if (filters.hasEnrollments) {
          query = query.gt('enrolled_count', 0);
        }
      }

      // Apply sorting
      const sortBy = sortOptions?.sortBy || 'created_at';
      const sortOrder = sortOptions?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching sequences:', error);
      throw error;
    }
  },

  /**
   * Get sequence by ID with full details including steps and analytics
   */
  async getSequenceById(id: string) {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .select(`
          *,
          steps:sequence_steps(
            *,
            conditions:sequence_step_conditions(*),
            analytics:sequence_step_analytics(*)
          ),
          enrollments:sequence_enrollments(
            count
          ),
          daily_analytics:sequence_analytics_daily(
            *
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sequence:', error);
      throw error;
    }
  },

  /**
   * Create a new sequence
   */
  async createSequence(sequenceData: Partial<EmailSequence>) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('email_sequences')
        .insert({
          name: sequenceData.name,
          description: sequenceData.description,
          owner_id: userId,
          status: sequenceData.status || 'draft',
          settings: sequenceData.settings,
          audience_filters: sequenceData.audienceFilters || [],
          exclude_filters: sequenceData.excludeFilters || [],
          tags: sequenceData.tags || [],
          folder: sequenceData.folder,
          ai_optimization_enabled: sequenceData.aiOptimizationEnabled || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sequence:', error);
      throw error;
    }
  },

  /**
   * Update a sequence
   */
  async updateSequence(id: string, updates: Partial<EmailSequence>) {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .update({
          name: updates.name,
          description: updates.description,
          status: updates.status,
          settings: updates.settings,
          audience_filters: updates.audienceFilters,
          exclude_filters: updates.excludeFilters,
          tags: updates.tags,
          folder: updates.folder,
          ai_optimization_enabled: updates.aiOptimizationEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating sequence:', error);
      throw error;
    }
  },

  /**
   * Delete a sequence
   */
  async deleteSequence(id: string) {
    try {
      const { error } = await supabase
        .from('email_sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting sequence:', error);
      throw error;
    }
  },

  /**
   * Clone a sequence with options
   */
  async cloneSequence(options: CloneSequenceOptions) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = options.ownerId || session?.session?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Fetch original sequence
      const original = await this.getSequenceById(options.sequenceId);
      if (!original) {
        throw new Error('Original sequence not found');
      }

      // Create new sequence
      const { data: newSequence, error: sequenceError } = await supabase
        .from('email_sequences')
        .insert({
          name: options.newName,
          description: original.description,
          owner_id: userId,
          status: 'draft',
          settings: options.cloneSettings ? original.settings : undefined,
          audience_filters: original.audience_filters,
          exclude_filters: original.exclude_filters,
          tags: original.tags,
          folder: original.folder
        })
        .select()
        .single();

      if (sequenceError) throw sequenceError;

      // Clone steps if requested
      if (options.cloneSteps && original.steps && newSequence) {
        const stepsToClone = original.steps.map((step: any) => ({
          sequence_id: newSequence.id,
          step_number: step.step_number,
          step_type: step.step_type,
          name: step.name,
          description: step.description,
          delay_days: step.delay_days,
          delay_hours: step.delay_hours,
          send_time: step.send_time,
          timezone: step.timezone,
          skip_weekends: step.skip_weekends,
          respect_timezone: step.respect_timezone,
          template_id: options.cloneTemplates ? step.template_id : null,
          subject: step.subject,
          body: step.body,
          variables: step.variables,
          personalization_enabled: step.personalization_enabled,
          is_active: step.is_active,
          position_x: step.position_x,
          position_y: step.position_y,
          parent_step_id: step.parent_step_id,
          branch_path: step.branch_path
        }));

        const { error: stepsError } = await supabase
          .from('sequence_steps')
          .insert(stepsToClone);

        if (stepsError) throw stepsError;
      }

      // Record the clone relationship
      const { error: cloneError } = await supabase
        .from('sequence_clones')
        .insert({
          original_sequence_id: options.sequenceId,
          cloned_sequence_id: newSequence.id,
          clone_type: options.cloneSteps ? 'full' : 'partial',
          cloned_with_data: !options.resetPerformanceMetrics,
          cloned_with_enrollments: options.cloneEnrollments,
          cloned_by: userId
        });

      if (cloneError) throw cloneError;

      return newSequence;
    } catch (error) {
      console.error('Error cloning sequence:', error);
      throw error;
    }
  },

  /**
   * Activate or pause a sequence
   */
  async toggleSequenceStatus(id: string, activate: boolean) {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .update({
          status: activate ? 'active' : 'paused',
          is_active: activate,
          last_run_at: activate ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling sequence status:', error);
      throw error;
    }
  },

  /**
   * Archive a sequence
   */
  async archiveSequence(id: string) {
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .update({
          status: 'archived',
          is_active: false,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error archiving sequence:', error);
      throw error;
    }
  },

  /**
   * Validate sequence configuration
   */
  async validateSequence(id: string): Promise<SequenceValidationResult> {
    try {
      const sequence = await this.getSequenceById(id);
      if (!sequence) {
        throw new Error('Sequence not found');
      }

      const errors = [];
      const warnings = [];

      // Check if sequence has steps
      if (!sequence.steps || sequence.steps.length === 0) {
        errors.push({
          type: 'missing_step' as const,
          message: 'Sequence must have at least one step'
        });
      }

      // Check for broken branches
      for (const step of sequence.steps || []) {
        if (step.conditions) {
          for (const condition of step.conditions) {
            if (condition.action === 'move_to_step' && !condition.target_step_id) {
              errors.push({
                type: 'broken_branch' as const,
                message: `Step ${step.step_number} has a condition with no target step`,
                stepId: step.id
              });
            }
          }
        }
      }

      // Performance warnings
      if (sequence.open_rate < 20) {
        warnings.push({
          type: 'performance' as const,
          message: 'Open rate is below 20%',
          suggestion: 'Consider improving subject lines or sending time'
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating sequence:', error);
      throw error;
    }
  }
};

// =====================================================
// SEQUENCE STEPS OPERATIONS
// =====================================================

export const sequenceStepService = {
  /**
   * Get all steps for a sequence
   */
  async getSteps(sequenceId: string) {
    try {
      const { data, error } = await supabase
        .from('sequence_steps')
        .select(`
          *,
          conditions:sequence_step_conditions(*),
          analytics:sequence_step_analytics(*)
        `)
        .eq('sequence_id', sequenceId)
        .order('step_number');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sequence steps:', error);
      throw error;
    }
  },

  /**
   * Create a new step
   */
  async createStep(stepData: Partial<SequenceStep>) {
    try {
      const { data, error } = await supabase
        .from('sequence_steps')
        .insert({
          sequence_id: stepData.sequenceId,
          step_number: stepData.stepNumber,
          step_type: stepData.stepType,
          name: stepData.name,
          description: stepData.description,
          delay_days: stepData.delayDays || 0,
          delay_hours: stepData.delayHours || 0,
          send_time: stepData.sendTime,
          timezone: stepData.timezone || 'America/New_York',
          skip_weekends: stepData.skipWeekends !== false,
          respect_timezone: stepData.respectTimezone !== false,
          template_id: stepData.templateId,
          subject: stepData.subject,
          body: stepData.body,
          variables: stepData.variables || {},
          personalization_enabled: stepData.personalizationEnabled !== false,
          is_active: stepData.isActive !== false,
          position_x: stepData.positionX || 0,
          position_y: stepData.positionY || 0,
          parent_step_id: stepData.parentStepId,
          branch_path: stepData.branchPath
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sequence step:', error);
      throw error;
    }
  },

  /**
   * Update a step
   */
  async updateStep(id: string, updates: Partial<SequenceStep>) {
    try {
      const { data, error } = await supabase
        .from('sequence_steps')
        .update({
          name: updates.name,
          description: updates.description,
          delay_days: updates.delayDays,
          delay_hours: updates.delayHours,
          send_time: updates.sendTime,
          timezone: updates.timezone,
          skip_weekends: updates.skipWeekends,
          respect_timezone: updates.respectTimezone,
          template_id: updates.templateId,
          subject: updates.subject,
          body: updates.body,
          variables: updates.variables,
          personalization_enabled: updates.personalizationEnabled,
          is_active: updates.isActive,
          position_x: updates.positionX,
          position_y: updates.positionY,
          parent_step_id: updates.parentStepId,
          branch_path: updates.branchPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating sequence step:', error);
      throw error;
    }
  },

  /**
   * Delete a step
   */
  async deleteStep(id: string) {
    try {
      const { error } = await supabase
        .from('sequence_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting sequence step:', error);
      throw error;
    }
  },

  /**
   * Reorder steps
   */
  async reorderSteps(sequenceId: string, stepOrders: Array<{ id: string; stepNumber: number }>) {
    try {
      const updates = stepOrders.map(({ id, stepNumber }) =>
        supabase
          .from('sequence_steps')
          .update({ step_number: stepNumber })
          .eq('id', id)
      );

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Error reordering sequence steps:', error);
      throw error;
    }
  }
};

// =====================================================
// ENROLLMENT OPERATIONS
// =====================================================

export const enrollmentService = {
  /**
   * Get enrollments for a sequence
   */
  async getEnrollments(
    sequenceId: string,
    status?: string,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      let query = supabase
        .from('sequence_enrollments')
        .select('*', { count: 'exact' })
        .eq('sequence_id', sequenceId);

      if (status) {
        query = query.eq('status', status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('enrolled_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  },

  /**
   * Bulk enroll prospects
   */
  async bulkEnroll(request: BulkEnrollmentRequest): Promise<BulkEnrollmentResult> {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const enrollments = request.prospectIds.map(prospectId => ({
        sequence_id: request.sequenceId,
        prospect_id: prospectId,
        status: request.startImmediately ? 'active' : 'pending',
        enrolled_by: userId,
        ab_test_variant: request.abTestVariant,
        metadata: request.metadata || {}
      }));

      const { data, error } = await supabase
        .from('sequence_enrollments')
        .insert(enrollments)
        .select();

      if (error) {
        // Handle duplicate enrollments gracefully
        if (error.code === '23505') {
          return {
            success: false,
            enrolledCount: 0,
            failedCount: request.prospectIds.length,
            duplicateCount: request.prospectIds.length,
            errors: [{
              prospectId: 'multiple',
              error: 'Some prospects are already enrolled in this sequence'
            }]
          };
        }
        throw error;
      }

      return {
        success: true,
        enrolledCount: data?.length || 0,
        failedCount: 0,
        duplicateCount: 0,
        errors: []
      };
    } catch (error) {
      console.error('Error bulk enrolling prospects:', error);
      throw error;
    }
  },

  /**
   * Unenroll a prospect
   */
  async unenroll(enrollmentId: string, reason: string) {
    try {
      const { data, error } = await supabase
        .from('sequence_enrollments')
        .update({
          status: 'completed',
          exit_reason: reason,
          completed_at: new Date().toISOString()
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error unenrolling prospect:', error);
      throw error;
    }
  },

  /**
   * Pause an enrollment
   */
  async pauseEnrollment(enrollmentId: string) {
    try {
      const { data, error } = await supabase
        .from('sequence_enrollments')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString()
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error pausing enrollment:', error);
      throw error;
    }
  },

  /**
   * Resume an enrollment
   */
  async resumeEnrollment(enrollmentId: string) {
    try {
      const { data, error } = await supabase
        .from('sequence_enrollments')
        .update({
          status: 'active',
          paused_at: null
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resuming enrollment:', error);
      throw error;
    }
  }
};

// =====================================================
// ANALYTICS OPERATIONS
// =====================================================

export const analyticsService = {
  /**
   * Get sequence performance metrics
   */
  async getSequencePerformance(
    sequenceId: string,
    startDate?: string,
    endDate?: string
  ): Promise<SequencePerformanceMetrics | null> {
    try {
      let query = supabase
        .from('sequence_analytics_daily')
        .select('*')
        .eq('sequence_id', sequenceId);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      query = query.order('date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      // Aggregate metrics
      const totalEnrolled = data.reduce((sum, day) => sum + (day.enrolled_count || 0), 0);
      const totalSent = data.reduce((sum, day) => sum + (day.emails_sent || 0), 0);
      const totalOpened = data.reduce((sum, day) => sum + (day.emails_opened || 0), 0);
      const totalClicked = data.reduce((sum, day) => sum + (day.emails_clicked || 0), 0);
      const totalReplied = data.reduce((sum, day) => sum + (day.emails_replied || 0), 0);
      const totalBounced = data.reduce((sum, day) => sum + (day.emails_bounced || 0), 0);
      const meetingsBooked = data.reduce((sum, day) => sum + (day.meetings_booked || 0), 0);

      return {
        sequenceId,
        sequenceName: '', // Fetch from sequence table if needed
        startDate: startDate || data[0].date,
        endDate: endDate || data[data.length - 1].date,
        period: 'custom',
        totalEnrolled,
        totalActive: 0, // Calculate from enrollments
        totalCompleted: 0, // Calculate from enrollments
        totalSent,
        totalOpened,
        totalClicked,
        totalReplied,
        totalBounced,
        meetingsBooked,
        dealsCreated: 0,
        revenue: 0,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
        meetingBookedRate: totalEnrolled > 0 ? (meetingsBooked / totalEnrolled) * 100 : 0,
        dealConversionRate: 0,
        funnelData: [],
        trendData: data.map(day => ({
          date: day.date,
          enrolled: day.enrolled_count || 0,
          opened: day.emails_opened || 0,
          clicked: day.emails_clicked || 0,
          replied: day.emails_replied || 0,
          meetingsBooked: day.meetings_booked || 0
        }))
      };
    } catch (error) {
      console.error('Error fetching sequence performance:', error);
      throw error;
    }
  },

  /**
   * Get step analytics
   */
  async getStepAnalytics(stepId: string): Promise<SequenceStepAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('sequence_step_analytics')
        .select('*')
        .eq('step_id', stepId)
        .maybeSingle();

      if (error) throw error;
      return data as SequenceStepAnalytics | null;
    } catch (error) {
      console.error('Error fetching step analytics:', error);
      throw error;
    }
  },

  /**
   * Get intent signals for a prospect
   */
  async getIntentSignals(prospectId: string, sequenceId: string) {
    try {
      const { data, error } = await supabase
        .from('sequence_intent_signals')
        .select('*')
        .eq('prospect_id', prospectId)
        .eq('sequence_id', sequenceId)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching intent signals:', error);
      throw error;
    }
  }
};

export default {
  ...sequenceService,
  steps: sequenceStepService,
  enrollments: enrollmentService,
  analytics: analyticsService
};
