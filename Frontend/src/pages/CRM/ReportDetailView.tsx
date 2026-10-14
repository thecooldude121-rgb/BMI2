import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/Layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

/**
 * /crm/reports/:reportSlug — an honest placeholder (2026-10-15).
 *
 * This page used to render hardcoded charts, pipeline splits and table rows
 * from a fixture keyed on the URL slug, under a heading built from that same
 * slug, so /crm/reports/anything showed "Anything" over invented figures. Report
 * Detail by id, backed by the saved-reports API, arrives with the reports replay
 * (step e). Until then the Reports page's View controls are disabled and this
 * route, kept so a bookmark lands somewhere, says the view is not built.
 *
 * The slug is deliberately NOT echoed back: any text in the URL would render as
 * a report's name.
 */
const ReportDetailView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Reports" title="Report detail" />
      <EmptyState
        title="Detailed report views are coming soon"
        reason="The figures for each report are on the Reports page, calculated from your workspace. A detailed view of a single report is not built yet."
        action={<Button variant="secondary" onClick={() => navigate('/crm/reports')}>Back to Reports</Button>}
      />
    </div>
  );
};

export default ReportDetailView;
