'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Save, TrendingDown, Tag, FileText, Banknote, CreditCard, Coins } from 'lucide-react'

export default function ExpensePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'ຄ່າໄຟຟ້າສ່ວນກາງ',
    amount: '',
    currency: 'LAK',
    paymentMethod: 'CASH',
    note: ''
  })

  const expenseCategories = ['ຄ່າໄຟຟ້າສ່ວນກາງ', 'ຄ່ານ້ຳປະປາ', 'ຄ່າເງິນເດືອນພະນັກງານ', 'ຄ່າສ້ອມແປງ', 'ຄ່າອຸປະກອນອະນາໄມ', 'ອື່ນໆ']

  const handleNumberChange = (value: string) => {
    const val = value.replace(/,/g, '')
    if (!isNaN(Number(val))) {
      setFormData({ ...formData, amount: val ? Number(val).toLocaleString('en-US') : '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = Number(formData.amount.replace(/,/g, ''))
    if (numericAmount <= 0) return alert('ກະລຸນາປ້ອນຈຳນວນເງິນ!')

    setIsSubmitting(true)
    const { error } = await supabase.from('expenses').insert([{
      expense_date: formData.expenseDate,
      category: formData.category,
      amount: numericAmount,
      currency: formData.currency,
      payment_method: formData.paymentMethod,
      note: formData.note
    }])
    setIsSubmitting(false)

    if (error) {
      alert('ເກີດຂໍ້ຜິດພາດ: ' + error.message)
    } else {
      alert('ບັນທຶກລາຍຈ່າຍສຳເລັດ!')
      setFormData({ ...formData, amount: '', note: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-white px-4 py-3.5 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">ບັນທຶກລາຍຈ່າຍ</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto w-full space-y-4 mt-2">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          
          <div className="flex space-x-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">ວັນທີຈ່າຍ:</label>
              <input 
                type="date" 
                value={formData.expenseDate}
                onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                className="w-full p-3 bg-gray-50 text-gray-700 font-bold rounded-xl outline-none border border-gray-200"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">ສະກຸນເງິນ:</label>
              <select 
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full p-3 bg-blue-50 text-blue-700 font-bold rounded-xl outline-none border border-blue-200"
              >
                <option value="LAK">ກີບ (LAK)</option>
                <option value="THB">ບາດ (THB)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center"><Tag className="w-4 h-4 mr-1" /> ໝວດໝູ່ລາຍຈ່າຍ:</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 bg-gray-50 text-gray-900 font-bold rounded-xl outline-none border border-gray-200"
            >
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center"><Coins className="w-4 h-4 mr-1" /> ຈຳນວນເງິນ:</label>
            <input 
              type="text" 
              value={formData.amount}
              onChange={(e) => handleNumberChange(e.target.value)}
              className="w-full p-4 bg-orange-50 text-orange-600 font-black text-2xl rounded-xl outline-none border border-orange-200 focus:border-orange-500 transition-all"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 flex items-center"><FileText className="w-4 h-4 mr-1" /> ລາຍລະອຽດ (ໝາຍເຫດ):</label>
            <textarea 
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="w-full p-3 bg-gray-50 text-gray-700 rounded-xl outline-none border border-gray-200 min-h-[80px]"
              placeholder="ປ້ອນລາຍລະອຽດເພີ່ມເຕີມ..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => setFormData({...formData, paymentMethod: 'CASH'})} 
              className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all font-bold ${formData.paymentMethod === 'CASH' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-400'}`}
            >
              <Banknote className="w-5 h-5 mr-2" /> ເງິນສົດ
            </button>
            <button 
              onClick={() => setFormData({...formData, paymentMethod: 'TRANSFER'})} 
              className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all font-bold ${formData.paymentMethod === 'TRANSFER' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-400'}`}
            >
              <CreditCard className="w-5 h-5 mr-2" /> ເງິນໂອນ
            </button>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex justify-center z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !formData.amount}
          className="w-full max-w-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white p-4 rounded-xl font-bold flex items-center justify-center shadow-lg disabled:opacity-50 transition-all"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSubmitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກລາຍຈ່າຍ'}
        </button>
      </div>
    </div>
  )
}