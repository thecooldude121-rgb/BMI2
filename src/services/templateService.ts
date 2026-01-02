// Template Service - Email Template Management
// Service for managing email templates, variants, and A/B testing

import { supabase } from '../lib/supabase';
import {
  EmailTemplate,
  TemplateVariant,
  TemplateCategory,
  TemplateVariable
} from '../types/sequences';

export const templateService = {
  /**
   * Get all templates with optional filtering
   */
  async getTemplates(
    filters?: {
      category?: TemplateCategory;
      isPublic?: boolean;
      tags?: string[];
      search?: string;
    },
    page: number = 1,
    limit: number = 50
  ) {
    try {
      let query = supabase
        .from('email_templates')
        .select(`
          *,
          variants:template_variants(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.isPublic !== undefined) {
          query = query.eq('is_public', filters.isPublic);
        }
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags);
        }
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
      }

      // Only show active templates
      query = query.eq('is_active', true);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

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
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: string) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select(`
          *,
          variants:template_variants(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  },

  /**
   * Create a new template
   */
  async createTemplate(templateData: Partial<EmailTemplate>) {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Extract variables from subject and body
      const variables = this.extractVariables(
        templateData.subject || '',
        templateData.body || ''
      );

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: templateData.name,
          category: templateData.category || 'cold_outreach',
          subject: templateData.subject,
          body: templateData.body,
          description: templateData.description,
          industry: templateData.industry,
          persona: templateData.persona,
          variables: variables,
          is_active: true,
          is_public: templateData.isPublic || false,
          owner_id: userId,
          team_ids: templateData.teamIds || [],
          tags: templateData.tags || [],
          folder: templateData.folder
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  /**
   * Update a template
   */
  async updateTemplate(id: string, updates: Partial<EmailTemplate>) {
    try {
      // Extract variables if subject or body changed
      let variables = updates.variables;
      if (updates.subject || updates.body) {
        variables = this.extractVariables(
          updates.subject || '',
          updates.body || ''
        );
      }

      const { data, error } = await supabase
        .from('email_templates')
        .update({
          name: updates.name,
          category: updates.category,
          subject: updates.subject,
          body: updates.body,
          description: updates.description,
          industry: updates.industry,
          persona: updates.persona,
          variables: variables,
          is_public: updates.isPublic,
          tags: updates.tags,
          folder: updates.folder,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string) {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  /**
   * Extract variables from template content
   */
  extractVariables(subject: string, body: string): TemplateVariable[] {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variableSet = new Set<string>();

    // Extract from subject
    let match;
    while ((match = variablePattern.exec(subject)) !== null) {
      variableSet.add(match[1]);
    }

    // Extract from body
    while ((match = variablePattern.exec(body)) !== null) {
      variableSet.add(match[1]);
    }

    // Convert to TemplateVariable objects
    return Array.from(variableSet).map(name => ({
      name,
      label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: 'text',
      required: true,
      defaultValue: ''
    }));
  },

  /**
   * Render template with variables
   */
  renderTemplate(
    template: EmailTemplate,
    variables: Record<string, any>
  ): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    // Replace variables in subject and body
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(regex, String(value || ''));
      body = body.replace(regex, String(value || ''));
    }

    return { subject, body };
  },

  /**
   * Clone a template
   */
  async cloneTemplate(id: string, newName: string) {
    try {
      const original = await this.getTemplateById(id);
      if (!original) {
        throw new Error('Template not found');
      }

      return await this.createTemplate({
        name: newName,
        category: original.category as TemplateCategory,
        subject: original.subject,
        body: original.body,
        description: original.description,
        industry: original.industry,
        persona: original.persona,
        tags: original.tags,
        folder: original.folder
      });
    } catch (error) {
      console.error('Error cloning template:', error);
      throw error;
    }
  }
};

// =====================================================
// A/B TESTING - VARIANTS
// =====================================================

export const variantService = {
  /**
   * Create a new variant for A/B testing
   */
  async createVariant(variantData: Partial<TemplateVariant>) {
    try {
      const { data, error } = await supabase
        .from('template_variants')
        .insert({
          template_id: variantData.templateId,
          variant_name: variantData.variantName,
          subject: variantData.subject,
          body: variantData.body,
          weight: variantData.weight || 50,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Update parent template to indicate it has variants
      await supabase
        .from('email_templates')
        .update({ has_variants: true })
        .eq('id', variantData.templateId);

      return data;
    } catch (error) {
      console.error('Error creating variant:', error);
      throw error;
    }
  },

  /**
   * Update variant
   */
  async updateVariant(id: string, updates: Partial<TemplateVariant>) {
    try {
      const { data, error } = await supabase
        .from('template_variants')
        .update({
          variant_name: updates.variantName,
          subject: updates.subject,
          body: updates.body,
          weight: updates.weight,
          is_active: updates.isActive,
          is_winner: updates.isWinner,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating variant:', error);
      throw error;
    }
  },

  /**
   * Delete variant
   */
  async deleteVariant(id: string) {
    try {
      // Get variant info before deleting
      const { data: variant } = await supabase
        .from('template_variants')
        .select('template_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('template_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Check if template still has variants
      if (variant) {
        const { data: remainingVariants } = await supabase
          .from('template_variants')
          .select('id')
          .eq('template_id', variant.template_id);

        if (!remainingVariants || remainingVariants.length === 0) {
          await supabase
            .from('email_templates')
            .update({ has_variants: false })
            .eq('id', variant.template_id);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting variant:', error);
      throw error;
    }
  },

  /**
   * Calculate statistical significance between variants
   */
  calculateStatisticalSignificance(
    variantA: TemplateVariant,
    variantB: TemplateVariant
  ): { significant: boolean; confidenceLevel: number } {
    // Simple z-test for proportions
    const p1 = variantA.openRate / 100;
    const p2 = variantB.openRate / 100;
    const n1 = variantA.sentCount;
    const n2 = variantB.sentCount;

    if (n1 < 30 || n2 < 30) {
      // Not enough data
      return { significant: false, confidenceLevel: 0 };
    }

    const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
    const z = Math.abs((p1 - p2) / se);

    // Convert z-score to confidence level
    const confidenceLevel = this.zScoreToConfidence(z);

    return {
      significant: confidenceLevel >= 95,
      confidenceLevel
    };
  },

  /**
   * Convert z-score to confidence percentage
   */
  zScoreToConfidence(z: number): number {
    // Simplified conversion
    if (z >= 1.96) return 95;
    if (z >= 1.645) return 90;
    if (z >= 1.28) return 80;
    return Math.round((1 - Math.exp(-z * z / 2)) * 100);
  },

  /**
   * Select variant for A/B test based on weights
   */
  selectVariant(variants: TemplateVariant[]): TemplateVariant | null {
    const activeVariants = variants.filter(v => v.isActive);

    if (activeVariants.length === 0) {
      return null;
    }

    // If there's a declared winner, always use it
    const winner = activeVariants.find(v => v.isWinner);
    if (winner) {
      return winner;
    }

    // Calculate cumulative weights
    const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (const variant of activeVariants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }

    return activeVariants[0];
  },

  /**
   * Declare a winner in A/B test
   */
  async declareWinner(variantId: string) {
    try {
      // Get the variant and template
      const { data: variant } = await supabase
        .from('template_variants')
        .select('template_id')
        .eq('id', variantId)
        .single();

      if (!variant) {
        throw new Error('Variant not found');
      }

      // Reset all variants for this template
      await supabase
        .from('template_variants')
        .update({ is_winner: false })
        .eq('template_id', variant.template_id);

      // Set this variant as winner
      const { data, error } = await supabase
        .from('template_variants')
        .update({
          is_winner: true,
          weight: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)
        .select()
        .single();

      if (error) throw error;

      // Update template to use this variant
      await supabase
        .from('email_templates')
        .update({ active_variant_id: variantId })
        .eq('id', variant.template_id);

      return data;
    } catch (error) {
      console.error('Error declaring winner:', error);
      throw error;
    }
  }
};

export default {
  ...templateService,
  variants: variantService
};
