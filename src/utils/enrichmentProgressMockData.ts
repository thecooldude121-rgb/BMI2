import type { EnrichmentProgressState, EnrichedFieldData, FieldCategory } from '../types/enrichmentProgress';

export const initialEnrichmentState: EnrichmentProgressState = {
  totalFields: 20,
  completedFields: 0,
  overallProgress: 0,
  status: 'preparing',
  categories: [
    {
      id: 'contact',
      name: 'CONTACT INFORMATION',
      totalFields: 5,
      completedFields: 0,
      fields: [
        {
          fieldId: 'email',
          fieldName: 'Email',
          fieldIcon: '📧',
          category: 'contact',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'direct_phone',
          fieldName: 'Direct Phone',
          fieldIcon: '📱',
          category: 'contact',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'linkedin',
          fieldName: 'LinkedIn Profile',
          fieldIcon: '💼',
          category: 'contact',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'mobile_phone',
          fieldName: 'Mobile Phone',
          fieldIcon: '📱',
          category: 'contact',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'office_location',
          fieldName: 'Office Location',
          fieldIcon: '🏢',
          category: 'contact',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        }
      ]
    },
    {
      id: 'company',
      name: 'COMPANY INFORMATION',
      totalFields: 8,
      completedFields: 0,
      fields: [
        {
          fieldId: 'company_name',
          fieldName: 'Company Name',
          fieldIcon: '🏢',
          category: 'company',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'company_size',
          fieldName: 'Company Size',
          fieldIcon: '👥',
          category: 'company',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'industry',
          fieldName: 'Industry',
          fieldIcon: '🏭',
          category: 'company',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'annual_revenue',
          fieldName: 'Annual Revenue',
          fieldIcon: '💰',
          category: 'company',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'founded_year',
          fieldName: 'Founded Year',
          fieldIcon: '📅',
          category: 'company',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'headquarters',
          fieldName: 'Headquarters',
          fieldIcon: '🌎',
          category: 'company',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'tech_stack',
          fieldName: 'Tech Stack',
          fieldIcon: '💻',
          category: 'company',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'funding',
          fieldName: 'Funding Round',
          fieldIcon: '💵',
          category: 'company',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        }
      ]
    },
    {
      id: 'professional',
      name: 'PROFESSIONAL DETAILS',
      totalFields: 4,
      completedFields: 0,
      fields: [
        {
          fieldId: 'job_title',
          fieldName: 'Job Title',
          fieldIcon: '💼',
          category: 'professional',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'seniority',
          fieldName: 'Seniority Level',
          fieldIcon: '📊',
          category: 'professional',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'department',
          fieldName: 'Department',
          fieldIcon: '🏛️',
          category: 'professional',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'start_date',
          fieldName: 'Start Date',
          fieldIcon: '📆',
          category: 'professional',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        }
      ]
    },
    {
      id: 'social',
      name: 'SOCIAL PRESENCE',
      totalFields: 3,
      completedFields: 0,
      fields: [
        {
          fieldId: 'twitter',
          fieldName: 'Twitter Handle',
          fieldIcon: '🐦',
          category: 'social',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'github',
          fieldName: 'GitHub Profile',
          fieldIcon: '🐙',
          category: 'social',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        },
        {
          fieldId: 'personal_website',
          fieldName: 'Personal Website',
          fieldIcon: '🌐',
          category: 'social',
          status: 'queued',
          progress: 0,
          statusMessage: 'Waiting to start...'
        }
      ]
    }
  ]
};

export const enrichmentFieldData: Record<string, Partial<EnrichedFieldData>> = {
  email: {
    beforeValue: 'sarah.l@techstart.com',
    afterValue: 'sarah.lee@techstart.com',
    source: 'Apollo.io',
    confidence: 95,
    timestamp: 'Just now'
  },
  direct_phone: {
    beforeValue: '+1 (415) 234-xxxx',
    afterValue: '+1 (415) 234-5678',
    source: 'ZoomInfo',
    confidence: 92,
    timestamp: 'Just now'
  },
  linkedin: {
    beforeValue: '',
    afterValue: 'linkedin.com/in/sarah-lee-techstart',
    source: 'Apollo.io',
    confidence: 98,
    timestamp: 'Just now'
  },
  mobile_phone: {
    beforeValue: '',
    afterValue: '+1 (415) 789-0123',
    source: 'ZoomInfo',
    confidence: 88,
    timestamp: 'Just now'
  },
  office_location: {
    beforeValue: 'San Francisco',
    afterValue: 'San Francisco, CA 94105 (Financial District)',
    source: 'Apollo.io',
    confidence: 94,
    timestamp: 'Just now'
  },
  company_name: {
    beforeValue: 'TechStart',
    afterValue: 'TechStart Inc.',
    source: 'LinkedIn',
    confidence: 99,
    timestamp: 'Just now'
  },
  company_size: {
    beforeValue: '50-100',
    afterValue: '85 employees',
    source: 'LinkedIn',
    confidence: 94,
    timestamp: 'Just now'
  },
  industry: {
    beforeValue: 'Technology',
    afterValue: 'Enterprise SaaS - Sales Technology',
    source: 'ZoomInfo',
    confidence: 96,
    timestamp: 'Just now'
  },
  annual_revenue: {
    beforeValue: '',
    afterValue: '$12M - $15M',
    source: 'ZoomInfo',
    confidence: 91,
    timestamp: 'Just now'
  },
  founded_year: {
    beforeValue: '',
    afterValue: '2019',
    source: 'Crunchbase',
    confidence: 99,
    timestamp: 'Just now'
  },
  headquarters: {
    beforeValue: 'San Francisco',
    afterValue: 'San Francisco, CA (HQ) + Remote',
    source: 'Apollo.io',
    confidence: 93,
    timestamp: 'Just now'
  },
  tech_stack: {
    beforeValue: '',
    afterValue: 'React, Node.js, PostgreSQL, AWS',
    source: 'BuiltWith',
    confidence: 87,
    timestamp: 'Just now'
  },
  funding: {
    beforeValue: '',
    afterValue: 'Series A ($8.5M, led by Sequoia)',
    source: 'Crunchbase',
    confidence: 99,
    timestamp: 'Just now'
  },
  job_title: {
    beforeValue: 'VP Sales',
    afterValue: 'Vice President of Sales',
    source: 'LinkedIn',
    confidence: 97,
    timestamp: 'Just now'
  },
  seniority: {
    beforeValue: '',
    afterValue: 'VP Level',
    source: 'LinkedIn',
    confidence: 95,
    timestamp: 'Just now'
  },
  department: {
    beforeValue: 'Sales',
    afterValue: 'Sales & Revenue Operations',
    source: 'LinkedIn',
    confidence: 93,
    timestamp: 'Just now'
  },
  start_date: {
    beforeValue: '',
    afterValue: 'June 2021',
    source: 'LinkedIn',
    confidence: 90,
    timestamp: 'Just now'
  },
  twitter: {
    beforeValue: '',
    afterValue: '@sarahlee_sales',
    source: 'Hunter.io',
    confidence: 85,
    timestamp: 'Just now'
  },
  github: {
    beforeValue: '',
    afterValue: '',
    source: '',
    confidence: 0,
    error: 'No GitHub profile found',
    timestamp: 'Just now'
  },
  personal_website: {
    beforeValue: '',
    afterValue: 'sarahlee.tech',
    source: 'Hunter.io',
    confidence: 82,
    timestamp: 'Just now'
  }
};

export function simulateEnrichmentProgress(
  onUpdate: (state: EnrichmentProgressState) => void,
  onComplete: () => void
): () => void {
  let currentState = JSON.parse(JSON.stringify(initialEnrichmentState)) as EnrichmentProgressState;
  let currentFieldIndex = 0;
  let allFields: EnrichedFieldData[] = [];

  currentState.categories.forEach(cat => {
    allFields = [...allFields, ...cat.fields];
  });

  const totalFields = allFields.length;
  let aborted = false;
  const startTime = Date.now();
  currentState.startTime = startTime;
  currentState.message = `Preparing to enrich ${totalFields} fields...`;

  // Set initial queue positions
  allFields.forEach((field, index) => {
    field.queuePosition = index + 1;
  });

  const enrichField = (fieldIndex: number) => {
    if (aborted || fieldIndex >= totalFields) {
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const durationSec = (durationMs / 1000).toFixed(1);

      currentState.status = 'completed';
      currentState.overallProgress = 100;
      currentState.endTime = endTime;
      currentState.duration = `${durationSec}s`;
      currentState.message = `Successfully enriched ${totalFields} fields in ${durationSec}s`;
      onUpdate(currentState);
      onComplete();
      return;
    }

    const field = allFields[fieldIndex];
    const categoryIndex = currentState.categories.findIndex(c => c.id === field.category);
    const fieldInCategoryIndex = currentState.categories[categoryIndex].fields.findIndex(
      f => f.fieldId === field.fieldId
    );

    // Calculate estimated time remaining (1s per field)
    const remainingFields = totalFields - fieldIndex;
    const estimatedSeconds = remainingFields;

    field.status = 'enriching';
    field.statusMessage = `Fetching from ${enrichmentFieldData[field.fieldId]?.source || 'API'}...`;
    field.progress = 0;
    field.estimatedTimeRemaining = `${estimatedSeconds}s`;
    delete field.queuePosition;

    currentState.status = 'enriching';
    currentState.currentField = field.fieldId;
    currentState.message = `Enriching ${field.fieldName}... (${fieldIndex + 1}/${totalFields})`;
    currentState.categories[categoryIndex].fields[fieldInCategoryIndex] = { ...field };

    // Update queue positions for remaining fields
    for (let i = fieldIndex + 1; i < allFields.length; i++) {
      const queuedField = allFields[i];
      const qCatIndex = currentState.categories.findIndex(c => c.id === queuedField.category);
      const qFieldIndex = currentState.categories[qCatIndex].fields.findIndex(
        f => f.fieldId === queuedField.fieldId
      );
      currentState.categories[qCatIndex].fields[qFieldIndex].queuePosition = i - fieldIndex;
    }

    onUpdate({ ...currentState });

    let progress = 0;
    const progressInterval = setInterval(() => {
      if (aborted) {
        clearInterval(progressInterval);
        return;
      }

      progress += 20;
      field.progress = Math.min(progress, 100);
      currentState.categories[categoryIndex].fields[fieldInCategoryIndex] = { ...field };
      onUpdate({ ...currentState });

      if (progress >= 100) {
        clearInterval(progressInterval);

        const enrichedData = enrichmentFieldData[field.fieldId];
        if (enrichedData) {
          field.status = enrichedData.error ? 'failed' : 'completed';
          field.beforeValue = enrichedData.beforeValue;
          field.afterValue = enrichedData.afterValue;
          field.source = enrichedData.source;
          field.confidence = enrichedData.confidence;
          field.timestamp = enrichedData.timestamp;
          field.completedAt = new Date().toISOString();
          field.error = enrichedData.error;
          field.progress = 100;
          delete field.estimatedTimeRemaining;
        }

        currentState.categories[categoryIndex].fields[fieldInCategoryIndex] = { ...field };

        if (field.status === 'completed') {
          currentState.completedFields++;
          currentState.categories[categoryIndex].completedFields++;
        }

        currentState.overallProgress = Math.round((currentState.completedFields / totalFields) * 100);
        onUpdate({ ...currentState });

        setTimeout(() => {
          if (!aborted) {
            enrichField(fieldIndex + 1);
          }
        }, 500);
      }
    }, 200);
  };

  setTimeout(() => {
    if (!aborted) {
      enrichField(0);
    }
  }, 1000);

  return () => {
    aborted = true;
  };
}
