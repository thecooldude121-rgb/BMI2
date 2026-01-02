import {
  EmailValidation,
  PhoneValidation,
  DataQualityReport,
  DuplicateProspect,
  ValidationResult,
  StaleField,
  DataCompletenessProfile,
  CompletenessItem,
  CRITICAL_FIELDS,
  COMPLETENESS_WEIGHTS
} from '../types/dataEnrichment';

export class DataValidationService {
  private static instance: DataValidationService;

  private constructor() {}

  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  validateEmail(email: string): EmailValidation {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    const domain = email.split('@')[1];
    const isDisposable = this.checkDisposableEmail(domain);
    const isRoleBased = this.checkRoleBasedEmail(email);

    let status: EmailValidation['status'] = 'unverified';
    let deliverability: EmailValidation['deliverability'] = 'unknown';
    let bounceRisk: EmailValidation['bounceRisk'] = 'medium';

    if (!isValidFormat) {
      status = 'invalid';
      deliverability = 'undeliverable';
      bounceRisk = 'high';
    } else if (isDisposable || isRoleBased) {
      status = 'risky';
      bounceRisk = 'high';
    } else if (this.checkMxRecords(domain)) {
      status = 'verified';
      deliverability = 'deliverable';
      bounceRisk = 'low';
    }

    return {
      email,
      isValid: isValidFormat,
      status,
      deliverability,
      isDisposable,
      isRoleBased,
      bounceRisk,
      provider: 'internal',
      verifiedAt: new Date().toISOString(),
      smtpCheck: true,
      mxRecords: this.checkMxRecords(domain)
    };
  }

  validatePhone(phone: string): PhoneValidation {
    const cleaned = phone.replace(/\D/g, '');
    const isValid = cleaned.length >= 10 && cleaned.length <= 15;

    let formatted = phone;
    let countryCode = '+1';

    if (isValid) {
      if (cleaned.length === 10) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else if (cleaned.length === 11 && cleaned[0] === '1') {
        countryCode = '+1';
        formatted = `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
    }

    return {
      phone,
      isValid,
      formatted,
      countryCode,
      lineType: 'mobile',
      carrier: 'Unknown',
      verifiedAt: new Date().toISOString()
    };
  }

  async findDuplicates(prospect: any): Promise<DuplicateProspect[]> {
    const duplicates: DuplicateProspect[] = [];

    if (prospect.email) {
      duplicates.push({
        id: 'duplicate-1',
        name: 'John Doe',
        company: 'Acme Corp',
        email: prospect.email,
        phone: '(555) 123-4567',
        similarity: 95,
        matchedFields: ['email'],
        createdAt: '2024-01-15'
      });
    }

    return duplicates;
  }

  calculateDataQuality(prospect: any): DataQualityReport {
    const validations: ValidationResult[] = [];
    const missingFields: string[] = [];
    const staleFields: StaleField[] = [];

    CRITICAL_FIELDS.forEach(field => {
      if (!prospect[field]) {
        missingFields.push(field);
        validations.push({
          field,
          isValid: false,
          status: 'invalid',
          message: 'Field is required',
          checkedAt: new Date().toISOString()
        });
      } else {
        validations.push({
          field,
          isValid: true,
          status: 'valid',
          checkedAt: new Date().toISOString()
        });
      }
    });

    if (prospect.email) {
      const emailValidation = this.validateEmail(prospect.email);
      validations.push({
        field: 'email',
        isValid: emailValidation.isValid,
        status: emailValidation.status === 'verified' ? 'valid' :
                emailValidation.status === 'invalid' ? 'invalid' : 'warning',
        message: emailValidation.status === 'verified' ? 'Email verified' :
                 emailValidation.status === 'risky' ? 'Email may be risky' :
                 'Email not verified',
        checkedAt: new Date().toISOString()
      });
    }

    if (prospect.lastUpdated) {
      const daysOld = Math.floor(
        (Date.now() - new Date(prospect.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOld > 180) {
        staleFields.push({
          field: 'profile',
          lastUpdated: prospect.lastUpdated,
          daysOld,
          isStale: true
        });
      }
    }

    const completeness = this.calculateCompleteness(prospect);
    const accuracy = this.calculateAccuracy(validations);
    const freshness = this.calculateFreshness(staleFields);
    const overallScore = Math.round((completeness + accuracy + freshness) / 3);

    let level: DataQualityReport['level'];
    if (overallScore >= 90) level = 'excellent';
    else if (overallScore >= 70) level = 'good';
    else if (overallScore >= 50) level = 'fair';
    else level = 'poor';

    return {
      overallScore,
      level,
      completeness,
      accuracy,
      freshness,
      validations,
      missingFields,
      staleFields,
      lastAssessed: new Date().toISOString()
    };
  }

  calculateCompletenessProfile(prospect: any): DataCompletenessProfile {
    const checklist: CompletenessItem[] = [];
    let totalWeight = 0;
    let completedWeight = 0;

    Object.entries(COMPLETENESS_WEIGHTS).forEach(([field, weight]) => {
      const hasValue = !!prospect[field];
      const isRequired = CRITICAL_FIELDS.includes(field);

      checklist.push({
        field,
        label: this.getFieldLabel(field),
        completed: hasValue,
        required: isRequired,
        weight
      });

      totalWeight += weight;
      if (hasValue) {
        completedWeight += weight;
      }
    });

    const completeness = Math.round((completedWeight / totalWeight) * 100);

    const criticalMissing = CRITICAL_FIELDS.filter(field => !prospect[field]);
    const suggestedActions = this.generateSuggestedActions(prospect, checklist);

    return {
      prospectId: prospect.id,
      completeness,
      checklist,
      suggestedActions,
      criticalMissing,
      lastUpdated: new Date().toISOString()
    };
  }

  private checkDisposableEmail(domain: string): boolean {
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      'guerrillamail.com',
      '10minutemail.com',
      'mailinator.com'
    ];
    return disposableDomains.some(d => domain.includes(d));
  }

  private checkRoleBasedEmail(email: string): boolean {
    const roleBasedPrefixes = [
      'info@',
      'support@',
      'sales@',
      'admin@',
      'contact@',
      'help@',
      'noreply@'
    ];
    return roleBasedPrefixes.some(prefix => email.startsWith(prefix));
  }

  private checkMxRecords(domain: string): boolean {
    return !domain.includes('test') && !domain.includes('example');
  }

  private calculateCompleteness(prospect: any): number {
    let filled = 0;
    let total = Object.keys(COMPLETENESS_WEIGHTS).length;

    Object.keys(COMPLETENESS_WEIGHTS).forEach(field => {
      if (prospect[field]) filled++;
    });

    return Math.round((filled / total) * 100);
  }

  private calculateAccuracy(validations: ValidationResult[]): number {
    const valid = validations.filter(v => v.isValid).length;
    return Math.round((valid / validations.length) * 100);
  }

  private calculateFreshness(staleFields: StaleField[]): number {
    if (staleFields.length === 0) return 100;
    const avgDaysOld = staleFields.reduce((sum, f) => sum + f.daysOld, 0) / staleFields.length;
    return Math.max(0, Math.round(100 - (avgDaysOld / 180) * 100));
  }

  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      email: 'Email Address',
      phone: 'Phone Number',
      firstName: 'First Name',
      lastName: 'Last Name',
      companyName: 'Company Name',
      jobTitle: 'Job Title',
      linkedinUrl: 'LinkedIn Profile',
      industry: 'Industry',
      location: 'Location',
      companySize: 'Company Size',
      companyWebsite: 'Company Website',
      notes: 'Notes',
      tags: 'Tags'
    };
    return labels[field] || field;
  }

  private generateSuggestedActions(prospect: any, checklist: CompletenessItem[]): string[] {
    const actions: string[] = [];

    if (!prospect.email) {
      actions.push('Add email address to enable outreach');
    }

    if (!prospect.phone) {
      actions.push('Add phone number for multi-channel contact');
    }

    if (!prospect.linkedinUrl) {
      actions.push('Add LinkedIn profile for professional context');
    }

    const missingHigh = checklist.filter(
      item => !item.completed && item.weight >= 10
    );

    if (missingHigh.length > 0) {
      actions.push(`Complete ${missingHigh.length} high-priority fields`);
    }

    if (actions.length === 0) {
      actions.push('Profile looks complete! Consider enriching data.');
    }

    return actions;
  }
}

export const dataValidationService = DataValidationService.getInstance();
