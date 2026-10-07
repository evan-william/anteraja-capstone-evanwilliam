// bootstrap only the current page, never fetch every workspace at startup.
export function bootstrapUrl(pathname: string, search: string): string {
  const views: Record<string, string> = {
    '/admin': 'admin', '/admin/kiriman': 'admin-shipments', '/admin/tiket': 'tickets',
    '/seller': 'seller', '/pengiriman': 'seller-shipments', '/akun': 'consumer', '/import': 'import',
  };
  let resources: string[] = [];
  if (views[pathname]) resources = [`/api/v1/view/${views[pathname]}${pathname === '/admin/kiriman' ? '?' + new URLSearchParams(search).toString() : ''}`];
  else if (pathname === '/kategori') resources = ['/api/v1/categories'];
  else if (pathname === '/transaksi') resources = ['/api/v1/transactions?limit=100', '/api/v1/categories?status=active'];
  else {
    const admin = pathname.match(/^\/admin\/pengiriman\/([^/]+)$/);
    const seller = pathname.match(/^\/pengiriman\/([^/]+)$/);
    if (admin || seller) resources = [`/api/v1/view/${admin ? 'admin' : 'seller'}/shipment/${(admin || seller)![1]}`];
  }
  const params = new URLSearchParams();
  for (const resource of resources) params.append('resources[]', resource);
  if (pathname === '/') params.set('home', '1');
  return '/api/v1/bootstrap?' + params.toString();
}
