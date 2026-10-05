'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Save, Home, Zap, 
  Trash2, Shield, Package, Banknote, CreditCard,
  Search, ChevronDown, Plus, X
} from 'lucide-react'

export default function CollectionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shops, setShops] = useState<any[]>([]) 
  
  // State ສຳລັບ Dropdown ຄົ້ນຫາຮ້ານ
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const [formData, setFormData] = useState({
    shop_number: '',
    collectionDate: new Date().toISOString().split('T')[0],
    forMonth: new Date().toISOString().slice(0, 7),
    rent: '', electricity: '', cleaning: '', security: '', 
    paymentMethod: 'CASH' 
  })

  // State ສຳລັບລາຍການ "ອື່ນໆ" (ສາມາດເພີ່ມໄດ້ຫຼາຍລາຍການ)
  const [otherItems, setOtherItems] = useState<{ amount: string, note: string }[]>([])

  // ດຶງຂໍ້ມູນໃໝ່ທຸກຄັ້ງທີ່ປ່ຽນ "ເດືອນຂອງບິນ"
  useEffect(() => {
    fetchPendingShops()
  }, [formData.forMonth])

  const fetchPendingShops = async () => {
    // 1. ດຶງຮ້ານທີ່ກຳລັງເຊົ່າທັງໝົດ ພ້ອມກັບເປົ້າໝາຍຄ່າເຊົ່າ ແລະ ຄ່າຍາມ
    const { data: shopsData } = await supabase
      .from('shops')
      .select('shop_number, tenant_name, rent_amount, security_fee')
      .eq('status', 'ກຳລັງເຊົ່າ')
      .order('shop_number')
    
    // 2. ດຶງຂໍ້ມູນການຈ່າຍເງິນຂອງເດືອນບິນ (forMonth) ທີ່ກຳລັງເລືອກ
    const { data: collectedData } = await supabase
      .from('collections')
      .select('shop_number, rent, security')
      .eq('for_month', formData.forMonth)

    if (shopsData) {
      if (!collectedData || collectedData.length === 0) {
        setShops(shopsData) // ຖ້າຍັງບໍ່ມີໃຜຈ່າຍເລີຍ ໃຫ້ສະແດງໝົດທຸກຮ້ານ
        return
      }

      // ກັ່ນຕອງຫາຮ້ານທີ່ "ຍັງຈ່າຍບໍ່ຄົບ" ຂອງເດືອນນັ້ນໆ
      const pending = shopsData.filter(shop => {
        // ດຶງເອົາບິນທັງໝົດທີ່ຮ້ານນີ້ເຄີຍຈ່າຍຂອງເດືອນນັ້ນ
        const shopCollections = collectedData.filter(c => c.shop_number === shop.shop_number)
        
        // ບວກຍອດເງິນທີ່ຈ່າຍໄປແລ້ວ
        const paidRent = shopCollections.reduce((sum, c) => sum + (Number(c.rent) || 0), 0)
        const paidSecurity = shopCollections.reduce((sum, c) => sum + (Number(c.security) || 0), 0)
        const totalPaid = paidRent + paidSecurity

        // ເປົ້າໝາຍທີ່ຮ້ານຕ້ອງຈ່າຍ
        const expectedTotal = (Number(shop.rent_amount) || 0) + (Number(shop.security_fee) || 0)

        // ຖ້າຍອດທີ່ຈ່າຍໄປແລ້ວ ຍັງນ້ອຍກວ່າເປົ້າໝາຍ ໝາຍຄວາມວ່າຍັງຈ່າຍບໍ່ຄົບ (ຫຼືເປັນການຈ່າຍໜີ້ບາງສ່ວນ)
        // ໃຫ້ນຳມາສະແດງໃນໜ້າເກັບເງິນເພື່ອໃຫ້ສາມາດເກັບຍອດທີ່ເຫຼືອໄດ້
        return totalPaid < expectedTotal
      })

      setShops(pending)
    }
  }

  // ອັບເດດ UseEffect ໃຫ້ເອີ້ນໃຊ້ເມື່ອປ່ຽນ forMonth ແທນ
  useEffect(() => {
    fetchPendingShops()
  }, [formData.forMonth])

  // ຟັງຊັນແປງຂໍ້ຄວາມທີ່ມີຈຸດ (1,000) ກັບມາເປັນຕົວເລກ (1000) ເພື່ອຄຳນວນ
  const parseNumber = (val: string) => Number(val.toString().replace(/,/g, '')) || 0

  // ຟັງຊັນຈັດການການພິມຕົວເລກໃຫ້ມີຈຸດອັດຕະໂນມັດ
  const handleNumberChange = (field: string, value: string) => {
    const val = value.replace(/,/g, '')
    if (!isNaN(Number(val))) {
      setFormData(prev => ({ ...prev, [field]: val ? Number(val).toLocaleString('en-US') : '' }))
    }
  }

  // ຟັງຊັນຈັດການລາຍການ "ອື່ນໆ"
  const handleOtherChange = (index: number, field: string, value: string) => {
    const newItems = [...otherItems]
    if (field === 'amount') {
      const val = value.replace(/,/g, '')
      if (!isNaN(Number(val))) {
        newItems[index][field as 'amount'] = val ? Number(val).toLocaleString('en-US') : ''
      }
    } else {
      newItems[index][field as 'note'] = value
    }
    setOtherItems(newItems)
  }

  const addOtherItem = () => setOtherItems([...otherItems, { amount: '', note: '' }])
  const removeOtherItem = (index: number) => setOtherItems(otherItems.filter((_, i) => i !== index))

  // ຄຳນວນຍອດລວມທັງໝົດ
  const totalOther = otherItems.reduce((sum, item) => sum + parseNumber(item.amount), 0)
  const totalAmount = 
    parseNumber(formData.rent) + parseNumber(formData.electricity) + 
    parseNumber(formData.cleaning) + parseNumber(formData.security) + 
    totalOther

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.shop_number) return alert('ກະລຸນາເລືອກຮ້ານຄ້າກ່ອນ!')
    if (totalAmount === 0) return alert('ກະລຸນາປ້ອນຈຳນວນເງິນຢ່າງນ້ອຍ 1 ລາຍການ!')
    
    setIsSubmitting(true)

    // ຮວມລາຍການອື່ນໆເຂົ້າກັນເປັນ Text ດຽວເພື່ອບັນທຶກລົງຖານຂໍ້ມູນເດີມ
    const combinedOtherNote = otherItems
      .filter(i => parseNumber(i.amount) > 0 || i.note)
      .map(i => `${i.note || 'ອື່ນໆ'}: ${i.amount}`)
      .join(' | ')

    const { error } = await supabase.from('collections').insert([{
      shop_number: formData.shop_number,
      collection_date: formData.collectionDate,
      for_month: formData.forMonth,
      rent: parseNumber(formData.rent),
      electricity: parseNumber(formData.electricity),
      cleaning: parseNumber(formData.cleaning),
      security: parseNumber(formData.security),
      other_amount: totalOther,
      other_note: combinedOtherNote,
      payment_method: formData.paymentMethod,
      total_amount: totalAmount
    }])
    
    setIsSubmitting(false)

    if (error) {
      alert('ເກີດຂໍ້ຜິດພາດ: ' + error.message)
    } else {
      alert('ບັນທຶກສຳເລັດ!')
      setFormData({
        shop_number: '', 
        collectionDate: formData.collectionDate, // ຮັກສາວັນທີທີ່ກຳລັງເລືອກໄວ້
        forMonth: new Date().toISOString().slice(0, 7),
        rent: '', electricity: '', cleaning: '', security: '', 
        paymentMethod: 'CASH'
      })
      setOtherItems([]) // ປ່ຽນເປັນ Array ເປົ່າ ເພື່ອລຶບຊ່ອງທັງໝົດຖິ້ມ
      setSearchQuery('')
      fetchPendingShops() // ໂຫຼດລາຍຊື່ຮ້ານໃໝ່ທັນທີ (ຮ້ານທີ່ຈ່າຍແລ້ວຈະຫາຍໄປ)
    }
  }

  // ຕົວກັ່ນຕອງຮ້ານຄ້າສຳລັບ Dropdown
  const filteredShops = shops.filter(s => 
    s.shop_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.tenant_name && s.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // ດຶງຊື່ຮ້ານທີ່ຖືກເລືອກມາສະແດງ
  const selectedShopDisplay = shops.find(s => s.shop_number === formData.shop_number)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-20">
        <button onClick={() => router.push('/')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full mr-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">ເກັບເງິນມື້ນີ້</h1>
      </header>

      <main className="flex-1 p-3 space-y-3 pb-28">
        
        {/* ສ່ວນເລືອກຮ້ານ ແລະ ວັນທີ */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          
          {/* Custom Searchable Dropdown */}
          <div className="relative">
            {/* ປຸ່ມກົດເປີດ Dropdown */}
            <div 
              onClick={() => setIsDropdownOpen(true)}
              className="w-full p-3 bg-emerald-50 text-emerald-900 font-bold text-base sm:text-lg rounded-xl border border-emerald-200 flex justify-between items-center cursor-pointer shadow-inner"
            >
              <span className={formData.shop_number ? 'text-emerald-900' : 'text-emerald-700/50'}>
                {formData.shop_number 
                  ? `${selectedShopDisplay?.shop_number} ${selectedShopDisplay?.tenant_name ? `- ${selectedShopDisplay.tenant_name}` : ''}` 
                  : '-- ກົດເພື່ອຄົ້ນຫາ ແລະ ເລືອກຮ້ານຄ້າ --'}
              </span>
              <ChevronDown className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Backdrop ປິດ Dropdown ເວລາກົດບ່ອນອື່ນ */}
            {isDropdownOpen && (
              <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)}></div>
            )}

            {/* ເມນູ Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-40 max-h-72 flex flex-col overflow-hidden">
                <div className="p-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="ພິມເລກຮ້ານ ຫຼື ຊື່ ເພື່ອຄົ້ນຫາ..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent outline-none w-full text-gray-700 font-medium"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredShops.length > 0 ? (
                    filteredShops.map(s => (
                      <div 
                        key={s.shop_number}
                        onClick={() => {
                          setFormData({...formData, shop_number: s.shop_number})
                          setIsDropdownOpen(false)
                          setSearchQuery('')
                        }}
                        className="p-3.5 hover:bg-emerald-50 cursor-pointer text-sm sm:text-base font-bold text-gray-700 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <span className="text-emerald-600 mr-2">{s.shop_number}</span> 
                        {s.tenant_name || 'ບໍ່ມີຊື່'}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">ບໍ່ພົບຮ້ານທີ່ຄົ້ນຫາ...</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ເລືອກວັນທີຮັບເງິນຈິງ & ເດືອນຂອງບິນ */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-500 mb-1 block">ຮັບເງິນຈິງວັນທີ:</label>
              <input 
                type="date" 
                value={formData.collectionDate}
                onChange={(e) => setFormData({...formData, collectionDate: e.target.value})}
                className="w-full p-2.5 bg-gray-50 text-gray-700 font-medium rounded-xl outline-none border border-gray-200 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-amber-600 mb-1 block">ຈ່າຍສຳລັບເດືອນ (ບິນ):</label>
              <input 
                type="month" 
                value={formData.forMonth}
                onChange={(e) => setFormData({...formData, forMonth: e.target.value})}
                className="w-full p-2.5 bg-amber-50 text-amber-900 font-bold rounded-xl outline-none border border-amber-200 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Grid ກອກຕົວເລກ (ຈັດລຽງແບບ 2x2) */}
        <div className="grid grid-cols-2 gap-3">
          {/* ຄ່າເຊົ່າ */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <label className="text-xs font-bold text-gray-500 mb-1 flex items-center">
              <Home className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> ຄ່າເຊົ່າຮ້ານ
            </label>
            <input 
              type="text" 
              value={formData.rent} 
              onChange={(e) => handleNumberChange('rent', e.target.value)} 
              className="w-full text-lg font-black text-gray-900 outline-none bg-transparent" 
              placeholder="0" 
            />
          </div>
          {/* ຄ່າໄຟ */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <label className="text-xs font-bold text-gray-500 mb-1 flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-orange-500" /> ຄ່າໄຟຟ້າ
            </label>
            <input 
              type="text" 
              value={formData.electricity} 
              onChange={(e) => handleNumberChange('electricity', e.target.value)} 
              className="w-full text-lg font-black text-gray-900 outline-none bg-transparent" 
              placeholder="0" 
            />
          </div>
          {/* ຄ່າອະນາໄມ */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <label className="text-xs font-bold text-gray-500 mb-1 flex items-center">
              <Trash2 className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> ຄ່າອະນາໄມ
            </label>
            <input 
              type="text" 
              value={formData.cleaning} 
              onChange={(e) => handleNumberChange('cleaning', e.target.value)} 
              className="w-full text-lg font-black text-gray-900 outline-none bg-transparent" 
              placeholder="0" 
            />
          </div>
          {/* ຄ່າຍາມ */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <label className="text-xs font-bold text-gray-500 mb-1 flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-slate-600" /> ຄ່າຍາມ
            </label>
            <input 
              type="text" 
              value={formData.security} 
              onChange={(e) => handleNumberChange('security', e.target.value)} 
              className="w-full text-lg font-black text-gray-900 outline-none bg-transparent" 
              placeholder="0" 
            />
          </div>
        </div>

        {/* ພາກສ່ວນ "ອື່ນໆ" (Dynamic ຫຼາຍລາຍການ) */}
        <div className="bg-amber-50 p-3 rounded-2xl shadow-sm border border-amber-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-amber-800 flex items-center">
              <Package className="w-4 h-4 mr-1.5" /> ລາຍການອື່ນໆ
            </label>
            <button 
              onClick={addOtherItem}
              className="bg-amber-200 text-amber-800 hover:bg-amber-300 p-1.5 rounded-lg text-xs font-bold flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> ເພີ່ມລາຍການ
            </button>
          </div>

          {otherItems.map((item, index) => (
            <div key={index} className="flex space-x-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-amber-700/70 mb-1 block">ຊື່ລາຍການ (ໝາຍເຫດ)</label>
                <input 
                  type="text" 
                  value={item.note} 
                  onChange={(e) => handleOtherChange(index, 'note', e.target.value)} 
                  className="w-full p-2.5 bg-white text-sm font-bold text-gray-900 rounded-xl outline-none border border-amber-200 focus:border-amber-400" 
                  placeholder="ເຊັ່ນ: ຄ່າປັບໃໝ" 
                />
              </div>
              <div className="flex-1 relative">
                <label className="text-[10px] font-bold text-amber-700/70 mb-1 block">ຈຳນວນເງິນ (ກີບ/ບາດ)</label>
                <input 
                  type="text" 
                  value={item.amount} 
                  onChange={(e) => handleOtherChange(index, 'amount', e.target.value)} 
                  className="w-full p-2.5 pr-8 bg-white text-base font-black text-gray-900 rounded-xl outline-none border border-amber-200 focus:border-amber-400" 
                  placeholder="0" 
                />
                {otherItems.length > 1 && (
                  <button 
                    onClick={() => removeOtherItem(index)}
                    className="absolute right-2 top-8 text-rose-400 hover:text-rose-600 bg-rose-50 p-1 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ວິທີການຊຳລະ */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setFormData({...formData, paymentMethod: 'CASH'})} 
            className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all font-bold ${formData.paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-gray-200 bg-white text-gray-400'}`}
          >
            <Banknote className="w-5 h-5 mr-2" /> ເງິນສົດ
          </button>
          <button 
            onClick={() => setFormData({...formData, paymentMethod: 'TRANSFER'})} 
            className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all font-bold ${formData.paymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 bg-white text-gray-400'}`}
          >
            <CreditCard className="w-5 h-5 mr-2" /> ເງິນໂອນ
          </button>
        </div>
      </main>

      {/* ແຖບສະຫຼຸບ ແລະ ປຸ່ມບັນທຶກ (Fixed ລຸ່ມສຸດ) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 pb-safe flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.15)] z-20 max-w-3xl mx-auto border-t border-gray-800">
        <div>
          <p className="text-xs text-gray-400 font-medium">ຍອດລວມທັງໝົດ</p>
          <p className="text-2xl font-black text-emerald-400">{totalAmount.toLocaleString()} <span className="text-sm">ກີບ/ບາດ</span></p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center shadow-lg disabled:opacity-50 transition-all"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSubmitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
        </button>
      </div>
    </div>
  )
}