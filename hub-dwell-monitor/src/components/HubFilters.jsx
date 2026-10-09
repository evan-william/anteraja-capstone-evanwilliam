export default function HubFilters({ query, onQuery, priorityOnly, onPriority, onReset }) {
  return <section aria-label="Filter hub" className="filters">
    <label className="search-field" htmlFor="hub-search"><span>Cari hub atau kota</span><input id="hub-search" name="hub-search" type="search" value={query} onChange={event => onQuery(event.target.value)} placeholder="Nama hub, kota, atau hub_id" /></label>
    <fieldset className="priority-filter"><legend>Tampilkan</legend>
      <label><input type="radio" name="priority" checked={!priorityOnly} onChange={() => onPriority(false)} />All Hubs</label>
      <label><input type="radio" name="priority" checked={priorityOnly} onChange={() => onPriority(true)} />Priority Only</label>
    </fieldset>
    <button type="button" className="text-button" onClick={onReset}>Reset filter</button>
  </section>;
}
