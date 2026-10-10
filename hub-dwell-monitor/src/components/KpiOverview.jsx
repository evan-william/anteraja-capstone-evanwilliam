import { count, hours } from '../metrics.js';

export default function KpiOverview({ kpi }) {
  const values = [
    ['Total Hub', count(kpi.total_hubs), 'Terhubung ke data lokasi'],
    ['Completed Visits', count(kpi.completed_visits), 'Arrival + departure valid'],
    ['Global Mean Dwell Time', hours(kpi.mean_dwell_hours), 'Berbobot completed visits'],
    ['Priority Hub Count', count(kpi.priority_hubs), 'Mean lebih dari 6 jam'],
  ];
  return <section aria-label="Global KPI" className="kpi-container"><dl className="kpis">
    {values.map(([label, value, help]) => <div key={label}><dt>{label}</dt><dd data-kpi={label}>{value}</dd><p>{help}</p></div>)}
  </dl></section>;
}
