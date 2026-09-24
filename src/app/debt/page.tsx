'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Receipt, ArrowLeft, Search, Store, FileText } from 'lucide-react'

interface ShopDebtSummary {
  id: string
  shop_number: string
  name: string | null
  total_balance: number
}

export default function DebtPage() {
  const [shops, setShops] = useState<ShopDebtSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchShopsDebt()
  }, [])

  const fetchShopsDebt = async () => {
    setLoading(true)
    const { data: shopsData, error } = await supabase
      .from('shops')
      .select('id, shop_number, name')
      .order('shop_number')

    if (!error && shopsData) {
      // จำลองข้อมูลยอดหนີ້คงค้างของแต่ละร้าน
      const mapped = shopsData.map(s => ({
        ...s,
        total_balance: 300000 // ຕົວຢ່າງຍອດໜີ້ຄ້າງ 300,000 LAK
      }))
      setShops(mapped)
    }
    setLoading(false)
  }

  const filteredShops = shops.filter(s => 
    s.shop_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <h1 className="text-lg font-bold text-gray-900">ບັນຊີໜີ້ & Statement</h1>
        </div>
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
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-rose-500 outline-none text-base shadow-xs"
          />
        </div>
      </div>

      {/* Shops Debt List */}
      <main className="px-4 max-w-2xl mx-auto space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນໜີ້...</div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-10 text-gray-500">ບໍ່ພົບຂໍ້ມູນໜີ້</div>
        ) : (
          filteredShops.map((shop) => (
            <div 
              key={shop.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-rose-600 text-base">{shop.shop_number}</span>
                  <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-medium">ມີໜີ້ຄ້າງ</span>
                </div>
                <h3 className="font-bold text-gray-900 mt-0.5">{shop.name || 'ຮ້ານຄ້າ'}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  ຍອດຄ້າງຊຳລະ: <span className="font-extrabold text-rose-600">{shop.total_balance.toLocaleString()} LAK</span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    import('@/utils/whatsapp').then(module => {
                      module.sendWhatsAppDebtReminder(shop.shop_number, shop.total_balance)
                    })
                  }}
                  className="px-3 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 active:scale-95 transition-all border border-emerald-200 flex items-center"
                >
                  WhatsApp
                </button>
                <button 
                  onClick={() => alert(`ເບິ່ງ Statement ຂອງຮ້ານ: ${shop.shop_number}`)}
                  className="px-3.5 py-2.5 bg-gray-50 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 active:scale-95 transition-all border border-gray-200 flex items-center space-x-1"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>Statement</span>
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}