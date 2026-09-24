'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Store, ArrowLeft, Search, Plus, MapPin, Phone, User } from 'lucide-react'

interface Shop {
  id: string
  shop_number: string
  name: string | null
  status: string
  size: string | null
  zones: { name: string } | null
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shops')
      .select(`
        id,
        shop_number,
        name,
        status,
        size,
        zones (name)
      `)
      .order('shop_number', { ascending: true })

    if (!error && data) {
      setShops(data as any)
    }
    setLoading(false)
  }

  // Filter ຕາມເລກຮ້ານ ຫຼື ຊື່ຮ້ານ
  const filteredShops = shops.filter((shop) => 
    shop.shop_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.name && shop.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.push('/')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">ຈັດການຮ້ານຄ້າ (150 ຮ້ານ)</h1>
        </div>
        <button 
          onClick={() => alert('ຟັງຊັນເພີ່ມຮ້ານໃໝ່')}
          className="bg-blue-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Search Bar */}
      <div className="p-4 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ຄົ້ນຫາເລກຮ້ານ, ຊື່ຮ້ານ..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-base shadow-xs"
          />
        </div>
      </div>

      {/* Shop List */}
      <main className="px-4 max-w-2xl mx-auto space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນຮ້ານ...</div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-10 text-gray-500">ບໍ່ພົບຂໍ້ມູນຮ້ານຄ້າ</div>
        ) : (
          filteredShops.map((shop) => (
            <div 
              key={shop.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex justify-between items-center"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-blue-600 text-base">{shop.shop_number}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    shop.status === 'ກຳລັງເຊົ່າ' ? 'bg-emerald-100 text-emerald-700' :
                    shop.status === 'ວ່າງ' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {shop.status}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mt-1">{shop.name || 'ຍັງບໍ່ມີຊື່ຮ້ານ'}</h3>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {shop.zones?.name || 'ບໍ່ມີໂຊນ'} {shop.size ? `• ຂະໜາດ: ${shop.size}` : ''}
                </p>
              </div>
              
              <button 
                onClick={() => alert(`ເບິ່ງລາຍລະອຽດຮ້ານ: ${shop.shop_number}`)}
                className="px-3.5 py-2 bg-gray-50 text-gray-700 font-medium text-xs rounded-xl hover:bg-gray-100 active:scale-95 transition-all border border-gray-200"
              >
                ຈັດການ
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  )
}