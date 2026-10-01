<?php
namespace App\Http\Controllers;
use App\Models\Courier;
use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
class ShipmentController extends Controller {
    public function index() { return view('shipments.index',['shipments'=>Shipment::with('courier')->latest('id')->paginate(15)]); }
    public function create() { return view('shipments.form',['shipment'=>new Shipment,'couriers'=>Courier::orderBy('name')->get()]); }
    public function store(Request $request) {
        $shipment = Shipment::create($this->validated($request));
        return redirect()->route('shipments.show',$shipment)->with('success','Kiriman berhasil ditambahkan.');
    }
    public function show(Shipment $shipment) { return view('shipments.show',['shipment'=>$shipment->load('courier')]); }
    public function edit(Shipment $shipment) { return view('shipments.form',['shipment'=>$shipment,'couriers'=>Courier::orderBy('name')->get()]); }
    public function update(Request $request, Shipment $shipment) {
        $shipment->update($this->validated($request,$shipment));
        return redirect()->route('shipments.show',$shipment)->with('success','Kiriman berhasil diperbarui.');
    }
    public function destroy(Shipment $shipment) { $shipment->delete(); return redirect()->route('shipments.index')->with('success','Kiriman berhasil dihapus.'); }
    private function validated(Request $request, ?Shipment $shipment=null): array {
        return $request->validate([
            'tracking_number'=>['required','string','max:80',Rule::unique('shipments')->ignore($shipment)],
            'weight_kg'=>['required','numeric','min:0.001','max:9999999.999'],
            'status'=>['required',Rule::in(array_keys(Shipment::STATUSES))],
            'courier_id'=>['required','integer','exists:couriers,id'],
        ],['tracking_number.unique'=>'Nomor resi sudah digunakan.','courier_id.exists'=>'Pilih kurir yang tersedia.']);
    }
}
