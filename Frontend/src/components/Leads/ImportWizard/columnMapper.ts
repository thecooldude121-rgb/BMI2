import type { CRMField, ColumnMapping, ParsedCSV } from './types';

export const CRM_FIELD_LABELS: Record<CRMField, string> = {
  first_name:    'First Name',
  last_name:     'Last Name',
  full_name:     'Full Name',
  email:         'Email',
  phone:         'Phone',
  company:       'Company',
  position:      'Job Title',
  industry:      'Industry',
  department:    'Department',
  company_size:  'Company Size',
  website:       'Website',
  linkedin_url:  'LinkedIn URL',
  city:          'City',
  country:       'Country',
  source:        'Lead Source',
  source_detail: 'Source Detail',
  utm_source:    'UTM Source',
  utm_medium:    'UTM Medium',
  utm_campaign:  'UTM Campaign',
  tags:          'Tags',
  notes:         'Notes',
  skip:          'Skip this column',
};

export const CRM_FIELDS_ORDERED: CRMField[] = [
  'first_name', 'last_name', 'full_name',
  'email', 'phone',
  'company', 'position', 'industry', 'department', 'company_size',
  'website', 'linkedin_url', 'city', 'country',
  'source', 'source_detail', 'utm_source', 'utm_medium', 'utm_campaign',
  'tags', 'notes', 'skip',
];

// Normalized aliases: key = normalized alias, value = CRM field
const ALIAS_MAP = new Map<string, CRMField>([
  // first_name
  ['first', 'first_name'], ['firstname', 'first_name'], ['fname', 'first_name'],
  ['givenname', 'first_name'], ['forename', 'first_name'], ['firstn', 'first_name'],
  // last_name
  ['last', 'last_name'], ['lastname', 'last_name'], ['lname', 'last_name'],
  ['surname', 'last_name'], ['familyname', 'last_name'], ['lastn', 'last_name'],
  // full_name
  ['name', 'full_name'], ['fullname', 'full_name'], ['contactname', 'full_name'],
  ['leadname', 'full_name'], ['contact', 'full_name'],
  // email
  ['email', 'email'], ['emailaddress', 'email'], ['mail', 'email'],
  ['email1', 'email'], ['businessemail', 'email'], ['workemail', 'email'],
  ['corporateemail', 'email'],
  // phone
  ['phone', 'phone'], ['telephone', 'phone'], ['tel', 'phone'],
  ['mobile', 'phone'], ['cell', 'phone'], ['phonenumber', 'phone'],
  ['mobilephone', 'phone'], ['contactnumber', 'phone'], ['cellphone', 'phone'],
  // company
  ['company', 'company'], ['companyname', 'company'], ['organization', 'company'],
  ['organisation', 'company'], ['account', 'company'], ['firm', 'company'],
  ['employer', 'company'], ['business', 'company'], ['accountname', 'company'],
  // position
  ['title', 'position'], ['jobtitle', 'position'], ['position', 'position'],
  ['role', 'position'], ['occupation', 'position'], ['designation', 'position'],
  ['joblevel', 'position'],
  // industry
  ['industry', 'industry'], ['sector', 'industry'], ['vertical', 'industry'],
  ['industrysector', 'industry'],
  // department
  ['department', 'department'], ['dept', 'department'], ['division', 'department'],
  // company_size
  ['companysize', 'company_size'], ['employees', 'company_size'],
  ['headcount', 'company_size'], ['numemployees', 'company_size'],
  // website
  ['website', 'website'], ['url', 'website'], ['web', 'website'],
  ['companywebsite', 'website'], ['siteurl', 'website'], ['homepage', 'website'],
  // linkedin_url
  ['linkedin', 'linkedin_url'], ['linkedinurl', 'linkedin_url'],
  ['linkedinprofile', 'linkedin_url'], ['linkedinlink', 'linkedin_url'],
  // city
  ['city', 'city'], ['town', 'city'],
  // country
  ['country', 'country'], ['nation', 'country'], ['countryregion', 'country'],
  // source
  ['source', 'source'], ['leadsource', 'source'], ['leadorigin', 'source'],
  // source_detail
  ['referral', 'source_detail'], ['referredby', 'source_detail'],
  ['sourcedetail', 'source_detail'],
  // utm
  ['utmsource', 'utm_source'], ['utmmedium', 'utm_medium'], ['utmcampaign', 'utm_campaign'],
  // tags
  ['tags', 'tags'], ['tag', 'tags'], ['labels', 'tags'], ['keywords', 'tags'],
  // notes
  ['notes', 'notes'], ['note', 'notes'], ['comments', 'notes'],
  ['description', 'notes'], ['remarks', 'notes'], ['memo', 'notes'],
]);

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function autoDetectField(csvHeader: string): CRMField | null {
  const n = normalize(csvHeader);
  return ALIAS_MAP.get(n) ?? null;
}

export function buildInitialMappings(parsed: ParsedCSV): ColumnMapping[] {
  return parsed.headers.map(header => {
    const detected = autoDetectField(header);
    return {
      csvHeader: header,
      crmField: detected ?? 'skip',
      autoDetected: detected !== null,
    };
  });
}

export function applyMappings(
  raw: Record<string, string>,
  mappings: ColumnMapping[],
): Partial<Record<CRMField, string>> {
  const result: Partial<Record<CRMField, string>> = {};
  for (const m of mappings) {
    if (m.crmField === 'skip') continue;
    const val = raw[m.csvHeader];
    if (val && !result[m.crmField]) {
      result[m.crmField] = val;
    }
  }
  return result;
}

export function getSampleValues(parsed: ParsedCSV, header: string, count = 3): string[] {
  const samples: string[] = [];
  for (const row of parsed.rows) {
    const v = row[header];
    if (v && !samples.includes(v)) samples.push(v);
    if (samples.length >= count) break;
  }
  return samples;
}
