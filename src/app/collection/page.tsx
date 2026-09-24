'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Wallet, ArrowLeft, Search, CheckCircle, ChevronRight, Store } from 'lucide-react'

interface ShopWithDebt {
  id: string
  shop_number: string
  name: string | null
  total_debt: number
}

export default function CollectionPage() {
  const [shops, setShops] = useState<ShopWithDebt[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchShopsWithDebt()
  }, [])

  const fetchShopsWithDebt = async () => {
    setLoading(true)
    // ดึงข้อมูลร้านค้าทั้งหมด
    const { data: shopsData, error } = await supabase
      .from('shops')
      .select('id, shop_number, name')
      .order('shop_number')

    if (!error && shopsData) {
      // จำลองยอดหนີ້เบื้องต้น (ในระบบจริงจะ sum จาก debt_ledger)
      const mapped = shopsData.map(s => ({
        ...s,
        total_debt: 150000 // ตัวอย่างยอดหนີ້ 150,000 ກີບ
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
          <h1 className="text-lg font-bold text-gray-900">ເກັບເງິນມື້ນີ້ (Quick Collection)</h1>
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
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-base shadow-xs"
          />
        </div>
      </div>

      {/* Shop Cards List */}
      <main className="px-4 max-w-2xl mx-auto space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">ກຳລັງໂຫຼດລາຍຊື່ຮ້ານ...</div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-10 text-gray-500">ບໍ່ພົບຂໍ້ມູນຮ້ານຄ້າ</div>
        ) : (
          filteredShops.map((shop) => (
            <div 
              key={shop.id}
              onClick={() => router.push(`/collection/pay?shopId=${shop.id}&shopNo=${shop.shop_number}&name=${encodeURIComponent(shop.name || '')}&debt=${shop.total_debt}`)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 active:scale-[0.99] transition-all"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-emerald-600 text-base">{shop.shop_number}</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">ຍັງບໍ່ເກັບ</span>
                </div>
                <h3 className="font-bold text-gray-900 mt-0.5">{shop.name || 'ຮ້ານທົ່ວໄປ'}</h3>
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  ໜີ້ຄ້າງ: {shop.total_debt.toLocaleString()} LAK
                </p>
              </div>

              <button className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center space-x-1 hover:bg-emerald-700">
                <span>ເກັບເງິນ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  )
}