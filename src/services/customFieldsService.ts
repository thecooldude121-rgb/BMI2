import {
  CustomField,
  FieldSection,
  FieldValidationResult,
  FieldError,
  FieldType,
  ValidationRule,
  ConditionalLogic,
  FieldProperties,
  FIELD_TYPE_CONFIG,
  DEFAULT_SECTIONS
} from '../types/customFields';

export class CustomFieldsService {
  private static instance: CustomFieldsService;
  private fields: Map<string, CustomField> = new Map();
  private sections: Map<string, FieldSection> = new Map();

  private constructor() {
    this.initializeDefaultSections();
  }

  static getInstance(): CustomFieldsService {
    if (!CustomFieldsService.instance) {
      CustomFieldsService.instance = new CustomFieldsService();
    }
    return CustomFieldsService.instance;
  }

  private initializeDefaultSections(): void {
    DEFAULT_SECTIONS.forEach(section => {
      this.sections.set(section.key, section);
    });
  }

  async createField(fieldData: Partial<CustomField>): Promise<CustomField> {
    const key = fieldData.key || this.generateFieldKey(fieldData.name!);

    const field: CustomField = {
      id: `field-${Date.now()}`,
      name: fieldData.name!,
      key,
      type: fieldData.type!,
      description: fieldData.description,
      helpText: fieldData.helpText,
      defaultValue: fieldData.defaultValue,
      placeholder: fieldData.placeholder,
      required: fieldData.required || false,
      searchable: fieldData.searchable || false,
      showInTable: fieldData.showInTable || false,
      showInForm: fieldData.showInForm !== false,
      section: fieldData.section || 'custom',
      order: fieldData.order || this.getNextOrderInSection(fieldData.section || 'custom'),
      status: 'active',
      validationRules: fieldData.validationRules || [],
      properties: this.mergeWithDefaults(fieldData.type!, fieldData.properties || {}),
      conditionalLogic: fieldData.conditionalLogic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user'
    };

    this.fields.set(key, field);

    // Add to section
    const section = this.sections.get(field.section);
    if (section && !section.fields.includes(key)) {
      section.fields.push(key);
    }

    return field;
  }

  async updateField(key: string, updates: Partial<CustomField>): Promise<CustomField> {
    const field = this.fields.get(key);
    if (!field) {
      throw new Error(`Field ${key} not found`);
    }

    const updatedField: CustomField = {
      ...field,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.fields.set(key, updatedField);
    return updatedField;
  }

  async deleteField(key: string): Promise<void> {
    const field = this.fields.get(key);
    if (field) {
      // Remove from section
      const section = this.sections.get(field.section);
      if (section) {
        section.fields = section.fields.filter(k => k !== key);
      }

      this.fields.delete(key);
    }
  }

  async archiveField(key: string): Promise<CustomField> {
    return this.updateField(key, { status: 'archived' });
  }

  getField(key: string): CustomField | undefined {
    return this.fields.get(key);
  }

  getAllFields(includeArchived = false): CustomField[] {
    const fields = Array.from(this.fields.values());
    return includeArchived
      ? fields
      : fields.filter(f => f.status === 'active');
  }

  getFieldsBySection(sectionKey: string): CustomField[] {
    const section = this.sections.get(sectionKey);
    if (!section) return [];

    return section.fields
      .map(key => this.fields.get(key))
      .filter((f): f is CustomField => f !== undefined && f.status === 'active')
      .sort((a, b) => a.order - b.order);
  }

  getSearchableFields(): CustomField[] {
    return this.getAllFields().filter(f => f.searchable);
  }

  getTableFields(): CustomField[] {
    return this.getAllFields().filter(f => f.showInTable);
  }

  async reorderFields(sectionKey: string, fieldKeys: string[]): Promise<void> {
    fieldKeys.forEach((key, index) => {
      const field = this.fields.get(key);
      if (field) {
        field.order = index;
        field.section = sectionKey;
      }
    });

    const section = this.sections.get(sectionKey);
    if (section) {
      section.fields = fieldKeys;
    }
  }

  validateFieldValue(field: CustomField, value: any): FieldValidationResult {
    const errors: FieldError[] = [];

    // Required validation
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} is required`,
        type: 'required'
      });
    }

    // Skip other validations if value is empty and not required
    if (!field.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, errors: [] };
    }

    // Type-specific validation
    switch (field.type) {
      case 'text':
      case 'textarea':
        this.validateText(field, value, errors);
        break;
      case 'number':
      case 'currency':
      case 'percentage':
        this.validateNumber(field, value, errors);
        break;
      case 'email':
        this.validateEmail(field, value, errors);
        break;
      case 'phone':
        this.validatePhone(field, value, errors);
        break;
      case 'url':
        this.validateUrl(field, value, errors);
        break;
      case 'date':
        this.validateDate(field, value, errors);
        break;
      case 'dropdown':
        this.validateDropdown(field, value, errors);
        break;
      case 'multi_select':
        this.validateMultiSelect(field, value, errors);
        break;
    }

    // Custom validation rules
    field.validationRules.forEach(rule => {
      if (rule.enabled) {
        const ruleError = this.applyValidationRule(field, value, rule);
        if (ruleError) {
          errors.push(ruleError);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateAllFields(values: Record<string, any>): FieldValidationResult {
    const allErrors: FieldError[] = [];

    this.getAllFields().forEach(field => {
      const value = values[field.key];
      const result = this.validateFieldValue(field, value);
      allErrors.push(...result.errors);
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  evaluateConditionalLogic(field: CustomField, allValues: Record<string, any>): {
    visible: boolean;
    required: boolean;
    disabled: boolean;
  } {
    if (!field.conditionalLogic || !field.conditionalLogic.enabled) {
      return {
        visible: true,
        required: field.required,
        disabled: false
      };
    }

    const logic = field.conditionalLogic;
    const conditionsMet = this.evaluateConditions(logic.conditions, logic.operator, allValues);

    let visible = true;
    let required = field.required;
    let disabled = false;

    if (conditionsMet) {
      switch (logic.action) {
        case 'show':
          visible = true;
          break;
        case 'hide':
          visible = false;
          break;
        case 'require':
          required = true;
          break;
        case 'disable':
          disabled = true;
          break;
      }
    } else {
      // Inverse logic when conditions not met
      switch (logic.action) {
        case 'show':
          visible = false;
          break;
        case 'hide':
          visible = true;
          break;
      }
    }

    return { visible, required, disabled };
  }

  private evaluateConditions(
    conditions: any[],
    operator: 'and' | 'or',
    values: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true;

    const results = conditions.map(condition => {
      const fieldValue = values[condition.fieldKey];
      return this.evaluateCondition(condition, fieldValue);
    });

    return operator === 'and'
      ? results.every(r => r)
      : results.some(r => r);
  }

  private evaluateCondition(condition: any, value: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'not_contains':
        return !String(value).includes(condition.value);
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'is_empty':
        return !value || value === '';
      case 'is_not_empty':
        return !!value && value !== '';
      default:
        return false;
    }
  }

  private validateText(field: CustomField, value: string, errors: FieldError[]): void {
    const props = field.properties;

    if (props.minLength && value.length < props.minLength) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be at least ${props.minLength} characters`,
        type: 'min'
      });
    }

    if (props.maxLength && value.length > props.maxLength) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be at most ${props.maxLength} characters`,
        type: 'max'
      });
    }

    if (props.pattern) {
      const regex = new RegExp(props.pattern);
      if (!regex.test(value)) {
        errors.push({
          fieldKey: field.key,
          fieldName: field.name,
          message: `${field.name} format is invalid`,
          type: 'pattern'
        });
      }
    }
  }

  private validateNumber(field: CustomField, value: number, errors: FieldError[]): void {
    const props = field.properties;

    if (isNaN(value)) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be a valid number`,
        type: 'custom'
      });
      return;
    }

    if (props.min !== undefined && value < props.min) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be at least ${props.min}`,
        type: 'min'
      });
    }

    if (props.max !== undefined && value > props.max) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be at most ${props.max}`,
        type: 'max'
      });
    }
  }

  private validateEmail(field: CustomField, value: string, errors: FieldError[]): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be a valid email address`,
        type: 'pattern'
      });
    }
  }

  private validatePhone(field: CustomField, value: string, errors: FieldError[]): void {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be a valid phone number`,
        type: 'pattern'
      });
    }
  }

  private validateUrl(field: CustomField, value: string, errors: FieldError[]): void {
    try {
      new URL(value);
    } catch {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be a valid URL`,
        type: 'pattern'
      });
    }
  }

  private validateDate(field: CustomField, value: string, errors: FieldError[]): void {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be a valid date`,
        type: 'pattern'
      });
      return;
    }

    const props = field.properties;
    if (props.minDate) {
      const minDate = new Date(props.minDate);
      if (date < minDate) {
        errors.push({
          fieldKey: field.key,
          fieldName: field.name,
          message: `${field.name} must be after ${props.minDate}`,
          type: 'min'
        });
      }
    }

    if (props.maxDate) {
      const maxDate = new Date(props.maxDate);
      if (date > maxDate) {
        errors.push({
          fieldKey: field.key,
          fieldName: field.name,
          message: `${field.name} must be before ${props.maxDate}`,
          type: 'max'
        });
      }
    }
  }

  private validateDropdown(field: CustomField, value: string, errors: FieldError[]): void {
    const props = field.properties;
    const options = props.options || [];
    const validValues = options.map(o => o.value);

    if (!props.allowCustom && !validValues.includes(value)) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be a valid option`,
        type: 'custom'
      });
    }
  }

  private validateMultiSelect(field: CustomField, value: any[], errors: FieldError[]): void {
    if (!Array.isArray(value)) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} must be an array`,
        type: 'custom'
      });
      return;
    }

    const props = field.properties;
    if (props.maxSelections && value.length > props.maxSelections) {
      errors.push({
        fieldKey: field.key,
        fieldName: field.name,
        message: `${field.name} can have at most ${props.maxSelections} selections`,
        type: 'max'
      });
    }
  }

  private applyValidationRule(
    field: CustomField,
    value: any,
    rule: ValidationRule
  ): FieldError | null {
    // Validation rules are already applied in type-specific methods
    // This method is for custom validation rules
    if (rule.type === 'custom') {
      // Custom validation logic would go here
      return null;
    }
    return null;
  }

  private generateFieldKey(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private getNextOrderInSection(sectionKey: string): number {
    const fieldsInSection = this.getFieldsBySection(sectionKey);
    return fieldsInSection.length > 0
      ? Math.max(...fieldsInSection.map(f => f.order)) + 1
      : 0;
  }

  private mergeWithDefaults(type: FieldType, properties: FieldProperties): FieldProperties {
    const defaults = FIELD_TYPE_CONFIG[type].defaultProperties;
    return { ...defaults, ...properties };
  }

  // Section management
  async createSection(sectionData: Partial<FieldSection>): Promise<FieldSection> {
    const section: FieldSection = {
      id: `section-${Date.now()}`,
      name: sectionData.name!,
      key: sectionData.key || this.generateFieldKey(sectionData.name!),
      description: sectionData.description,
      icon: sectionData.icon,
      order: sectionData.order || this.sections.size,
      collapsible: sectionData.collapsible !== false,
      defaultCollapsed: sectionData.defaultCollapsed || false,
      fields: []
    };

    this.sections.set(section.key, section);
    return section;
  }

  getAllSections(): FieldSection[] {
    return Array.from(this.sections.values()).sort((a, b) => a.order - b.order);
  }

  getSection(key: string): FieldSection | undefined {
    return this.sections.get(key);
  }
}

export const customFieldsService = CustomFieldsService.getInstance();
