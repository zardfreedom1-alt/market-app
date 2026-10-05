'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Store, ArrowLeft, Search, Map,Plus, MapPin, Upload, FileUp, Paperclip, CheckCircle, XCircle } from 'lucide-react'

interface Shop {
  id: string
  shop_number: string
  tenant_name: string | null
  status: string
  contract_date: string | null
  product_type: string | null
  rent_amount: number | null
  security_fee: number | null
  document_url: string | null
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // States ສຳລັບ Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null) // ເພີ່ມ State ເພື່ອແຍກລະຫວ່າງການເພີ່ມໃໝ່ ແລະ ແກ້ໄຂ
  const [newShop, setNewShop] = useState({
    shop_number: '', 
    tenant_name: '', 
    contract_date: '', 
    product_type: '',
    rent_amount: '',
    security_fee: '',
    status: 'ວ່າງ', 
    document_url: '' 
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('shop_number', { ascending: true })

    if (!error && data) {
      setShops(data as any)
    }
    setLoading(false)
  }

  // ຄຳນວນສະຖິຕິ
  const totalShops = shops.length
  const rentedShops = shops.filter(s => s.status === 'ກຳລັງເຊົ່າ').length
  const vacantShops = shops.filter(s => s.status === 'ວ່າງ').length

  const filteredShops = shops.filter((shop) => 
    shop.shop_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.tenant_name && shop.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShop.shop_number) return alert('ກະລຸນາປ້ອນເລກຮ້ານ')
    
    setIsSubmitting(true)
    const shopData = {
      shop_number: newShop.shop_number, 
      tenant_name: newShop.tenant_name || null, 
      contract_date: newShop.contract_date || null,
      product_type: newShop.product_type || null,
      rent_amount: Number(newShop.rent_amount) || 0,
      security_fee: Number(newShop.security_fee) || 0,
      status: newShop.status
    }

    let error;
    if (editingId) {
      // ຖ້າມີການແກ້ໄຂ (Update)
      const { error: updateError } = await supabase.from('shops').update(shopData).eq('id', editingId)
      error = updateError
    } else {
      // ຖ້າເປັນການເພີ່ມໃໝ່ (Insert)
      const { error: insertError } = await supabase.from('shops').insert([shopData])
      error = insertError
    }
      
    setIsSubmitting(false)
    
    if (error) {
      alert('ເກີດຂໍ້ຜິດພາດ: ' + error.message)
    } else {
      setIsAddModalOpen(false)
      setEditingId(null)
      setNewShop({ shop_number: '', tenant_name: '', contract_date: '', product_type: '', rent_amount: '', security_fee: '', status: 'ວ່າງ', document_url: '' })
      fetchShops()
    }
  }

  // ຟັງຊັນເປີດໜ້າຕ່າງແກ້ໄຂ
  const openEditModal = (shop: Shop) => {
    setEditingId(shop.id)
    setNewShop({
      shop_number: shop.shop_number || '',
      tenant_name: shop.tenant_name || '',
      contract_date: shop.contract_date || '',
      product_type: shop.product_type || '',
      rent_amount: shop.rent_amount?.toString() || '',
      security_fee: shop.security_fee?.toString() || '',
      status: shop.status || 'ວ່າງ',
      document_url: shop.document_url || ''
    })
    setIsAddModalOpen(true)
  }

  // ຟັງຊັນລຶບຮ້ານຄ້າ
  const handleDeleteShop = async (id: string, shopNumber: string) => {
    if (window.confirm(`ທ່ານຕ້ອງການລຶບຮ້ານ ${shopNumber} ແທ້ບໍ່? ການລຶບຈະບໍ່ສາມາດກູ້ຄືນໄດ້.`)) {
      const { error } = await supabase.from('shops').delete().eq('id', id)
      if (error) {
        alert('ລຶບບໍ່ສຳເລັດ: ' + error.message)
      } else {
        fetchShops() // ໂຫຼດຂໍ້ມູນໃໝ່ຫຼັງຈາກລຶບສຳເລັດ
      }
    }
  }

  // ຟັງຊັນສຳລັບປຸ່ມອັບໂຫຼດ Excel (ກຽມໄວ້ສຳລັບເຊື່ອມຕໍ່ໃນອະນາຄົດ)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      alert(`ກຳລັງກຽມອັບໂຫຼດຟາຍ: ${file.name} \n(ລະບົບອ່ານ Excel ກຳລັງພັດທະນາ)`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <button onClick={() => router.push('/')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">ຈັດການຮ້ານຄ້າ & ສັນຍາ</h1>
        </div>
        <div className="flex space-x-2">
          {/* 📍 ເພີ່ມປຸ່ມແຜນຜັງຮ້ານ */}
          <button 
            onClick={() => router.push('/shops/map')}
            className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl flex items-center justify-center hover:bg-indigo-200 transition-all"
            title="ເບິ່ງແຜນຜັງຕະຫຼາດ"
          >
            <Map className="w-5 h-5" />
          </button>

          {/* ປຸ່ມ Upload Excel */}
          <label className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-emerald-200 transition-all">
            <FileUp className="w-5 h-5" />
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          {/* ປຸ່ມເພີ່ມຮ້ານໃໝ່ */}
          <button 
            onClick={() => {
              setEditingId(null)
              setNewShop({ shop_number: '', tenant_name: '', contract_date: '', product_type: '', rent_amount: '', security_fee: '', status: 'ວ່າງ', document_url: '' })
              setIsAddModalOpen(true)
            }} 
            className="bg-blue-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-xs hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="p-4 max-w-4xl mx-auto grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-gray-500 text-xs font-bold mb-1">ທັງໝົດ</span>
          <span className="text-xl font-black text-blue-600">{totalShops}</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-gray-500 text-xs font-bold mb-1">ກຳລັງເຊົ່າ</span>
          <span className="text-xl font-black text-emerald-500">{rentedShops}</span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <span className="text-gray-500 text-xs font-bold mb-1">ວ່າງ</span>
          <span className="text-xl font-black text-gray-400">{vacantShops}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ຄົ້ນຫາເລກຮ້ານ, ຊື່ຜູ້ເຊົ່າ..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-xs"
          />
        </div>
      </div>

      {/* Shop List */}
      <main className="px-4 max-w-4xl mx-auto space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນຮ້ານ...</div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-10 text-gray-500">ບໍ່ພົບຂໍ້ມູນຮ້ານຄ້າ</div>
        ) : (
          filteredShops.map((shop) => (
            <div key={shop.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-blue-600 text-base">{shop.shop_number}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center ${
                    shop.status === 'ກຳລັງເຊົ່າ' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {shop.status === 'ກຳລັງເຊົ່າ' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {shop.status}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mt-1">{shop.tenant_name || 'ຍັງບໍ່ມີຜູ້ເຊົ່າ'}</h3>
                <p className="text-xs text-gray-500 mt-1">ປະເພດ: {shop.product_type || '-'}</p>
                {shop.status === 'ກຳລັງເຊົ່າ' && (
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    ຄ່າເຊົ່າ: {shop.rent_amount?.toLocaleString() || 0} ກີບ | ຄ່າຍາມ: {shop.security_fee?.toLocaleString() || 0} ກີບ
                  </p>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => openEditModal(shop)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 border border-blue-200 transition-all"
                >
                  ແກ້ໄຂ
                </button>
                <button 
                  onClick={() => handleDeleteShop(shop.id, shop.shop_number)}
                  className="px-4 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 border border-red-200 transition-all"
                >
                  ລຶບ
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal ເພີ່ມຮ້ານໃໝ່ (ແບບລະອຽດ) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-5 text-gray-900 border-b pb-3">
              {editingId ? 'ແກ້ໄຂຂໍ້ມູນຮ້ານຄ້າ' : 'ເພີ່ມຮ້ານຄ້າ / ສັນຍາໃໝ່'}
            </h2>
            <form onSubmit={handleAddShop} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ເລກຮ້ານ <span className="text-red-500">*</span></label>
                  <input type="text" required value={newShop.shop_number} onChange={(e) => setNewShop({...newShop, shop_number: e.target.value})} className="w-full p-2.5 border rounded-xl bg-gray-50" placeholder="ເຊັ່ນ: A01" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ສະຖານະ</label>
                  <select value={newShop.status} onChange={(e) => setNewShop({...newShop, status: e.target.value})} className="w-full p-2.5 border rounded-xl bg-gray-50 font-bold">
                    <option value="ວ່າງ">ວ່າງ (Vacant)</option>
                    <option value="ກຳລັງເຊົ່າ">ກຳລັງເຊົ່າ (Rented)</option>
                  </select>
                </div>
              </div>

              {newShop.status === 'ກຳລັງເຊົ່າ' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">ຊື່ຜູ້ເຊົ່າ</label>
                    <input type="text" value={newShop.tenant_name} onChange={(e) => setNewShop({...newShop, tenant_name: e.target.value})} className="w-full p-2.5 border rounded-xl bg-white" placeholder="ຊື່ນາມສະກຸນ ຫຼື ຊື່ຮ້ານ" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">ປະເພດເຄື່ອງຂາຍ</label>
                    <input type="text" value={newShop.product_type} onChange={(e) => setNewShop({...newShop, product_type: e.target.value})} className="w-full p-2.5 border rounded-xl bg-white" placeholder="ເຊັ່ນ: ເສື້ອຜ້າ, ອາຫານ, ເຄື່ອງດື່ມ" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">ວັນທີເລີ່ມສັນຍາ</label>
                    <input type="date" value={newShop.contract_date} onChange={(e) => setNewShop({...newShop, contract_date: e.target.value})} className="w-full p-2.5 border rounded-xl bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">ຄ່າເຊົ່າ (ກີບ)</label>
                      <input type="number" value={newShop.rent_amount} onChange={(e) => setNewShop({...newShop, rent_amount: e.target.value})} className="w-full p-2.5 border rounded-xl bg-white" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">ຄ່າຍາມ (ກີບ)</label>
                      <input type="number" value={newShop.security_fee} onChange={(e) => setNewShop({...newShop, security_fee: e.target.value})} className="w-full p-2.5 border rounded-xl bg-white" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">ຕິດຂັດເອກະສານ (PDF/ຮູບ)</label>
                    <div className="flex items-center justify-center w-full border-2 border-dashed border-blue-300 rounded-xl p-4 bg-white cursor-pointer hover:bg-blue-50">
                      <Paperclip className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-sm font-bold text-blue-600">ເລືອກໄຟລ໌ເອກະສານສັນຍາ</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 p-3 text-gray-600 bg-gray-100 rounded-xl font-bold">ຍົກເລີກ</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 p-3 text-white bg-blue-600 rounded-xl font-bold disabled:opacity-50">
                  {isSubmitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}