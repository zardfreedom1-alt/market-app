'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Calculator, ArrowLeft, Plus, Calendar, Store, Check } from 'lucide-react'

interface Shop {
  id: string
  shop_number: string
  name: string | null
}

export default function ElectricityPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState('')
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  
  // รายการอุปกรณ์ ค่าไฟ
  const [items, setItems] = useState([
    { name: 'ຕູ້ແຊ່', amount: '' },
    { name: 'ພັດລົມ', amount: '' },
    { name: 'ໄຟແສງສະຫວ່າງ', amount: '' },
    { name: 'ອຸປະກອນອື່ນໆ', amount: '' },
  ])
  
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    const { data } = await supabase.from('shops').select('id, shop_number, name').order('shop_number')
    if (data) setShops(data)
  }

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index].amount = value
    setItems(newItems)
  }

  // ຄຳນວນລວມຍອດເງິນຄ່າໄຟອັດຕະໂນມັດ
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShop) {
      alert('ກະລຸນາເລືອກຮ້ານຄ້າ!')
      return
    }

    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()

    // 1. บันทึกหัวบิลค่าไฟ
    const { data: readingData, error: readingError } = await supabase
      .from('electricity_readings')
      .insert({
        shop_id: selectedShop,
        reading_date: readingDate,
        total_amount: totalAmount,
        note: note,
        recorded_by: userData.user?.id
      })
      .select()
      .single()

    if (readingError || !readingData) {
      alert('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຄ່າໄຟ!')
      setLoading(false)
      return
    }

    // 2. บันทึกรายการอุปกรณ์แต่ละชิ้น
    const itemsToInsert = items
      .filter(i => parseFloat(i.amount) > 0)
      .map(i => ({
        reading_id: readingData.id,
        item_name: i.name,
        amount: parseFloat(i.amount)
      }))

    if (itemsToInsert.length > 0) {
      await supabase.from('electricity_items').insert(itemsToInsert)
    }

    setLoading(false)
    alert('ບັນທຶກຄ່າໄຟສຳເລັດແລ້ວ!')
    router.push('/')
  }

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
          <h1 className="text-lg font-bold text-gray-900">ບັນທຶກຄ່າໄຟ (ຕາມອຸປະກອນ)</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="p-4 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* เลือกฮ້ານ */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <label className="block text-sm font-bold text-gray-700">ເລືອກຮ້ານຄ້າ</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-base"
              required
            >
              <option value="">-- ເລືອກຮ້ານ --</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.shop_number} {shop.name ? `- ${shop.name}` : ''}
                </option>
              ))}
            </select>

            <label className="block text-sm font-bold text-gray-700 pt-2">ວັນທີບັນທຶກ</label>
            <input 
              type="date"
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-base"
              required
            />
          </div>

          {/* กรอกค่าไฟแต่ละอุปกรณ์ */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b pb-2">ກອກຈຳນວນເງິນແຕ່ລະອຸປະກອນ (LAK)</h3>
            
            {items.map((item, index) => (
              <div key={index} className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">{item.name}</label>
                <input 
                  type="number"
                  value={item.amount}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-base font-semibold text-gray-900"
                />
              </div>
            ))}
          </div>

          {/* สรุปยอดรวม */}
          <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-sm flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-xs font-medium">ລວມຍອດຄ່າໄຟມື້ນີ້</p>
              <h2 className="text-2xl font-extrabold mt-0.5">{totalAmount.toLocaleString()} LAK</h2>
            </div>
            <Calculator className="w-10 h-10 text-blue-200 opacity-80" />
          </div>

          {/* หมายเหตุ */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <label className="block text-sm font-bold text-gray-700 mb-1">ໝາຍເຫດ (ຖ້າມີ)</label>
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ເພີ່ມເຕີມ..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-base"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all text-lg shadow-sm flex items-center justify-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>{loading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກຄ່າໄຟ'}</span>
          </button>

        </form>
      </main>
    </div>
  )
}