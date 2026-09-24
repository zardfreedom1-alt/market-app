'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, ArrowLeft, CheckCircle2, AlertCircle, Send } from 'lucide-react'

export default function HandoverPage() {
  const [cashAmount, setCashAmount] = useState('')
  const [transferAmount, setTransferAmount] = useState('0')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // ຕົວຢ່າງຄຳນວນຍອດທີ່ຄວນມີ (ໃນระบบจริงจะดึงจาก sum payments ของวันนี้)
  const expectedCash = 1500000 // ຕົວຢ່າງເງິນສົດຄວນມີ 1,500,000 LAK
  const actualCash = parseFloat(cashAmount) || 0
  const discrepancy = actualCash - expectedCash

  const handleHandover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cashAmount) {
      alert('ກະລຸນາປ້ອນຍອດເງິນສົດທີ່ນັບໄດ້!')
      return
    }

    if (discrepancy !== 0 && !reason) {
      alert('ຍອດເງິນບໍ່ກົງກັນ! ກະລຸນາລະບຸເຫດຜົນ.')
      return
    }

    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from('cash_handovers').insert({
      cashier_id: userData.user?.id,
      handover_date: new Date().toISOString().split('T')[0],
      total_cash: actualCash,
      total_transfer: parseFloat(transferAmount) || 0,
      total_amount: actualCash + (parseFloat(transferAmount) || 0),
      discrepancy_amount: discrepancy,
      reason: reason || null,
      status: 'PENDING'
    })

    if (error) {
      alert('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງມອບເງິນ!')
      setLoading(false)
      return
    }

    setLoading(false)
    alert('ສົ່ງມອບເງິນສຳເລັດແລ້ວ! ລໍຖ້າ Manager ກວດສອບ.')
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
          <h1 className="text-lg font-bold text-gray-900">ມອບ-ຮັບເງິນ (Cash Handover)</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-xl mx-auto space-y-4">
        {/* Summary Card */}
        <div className="bg-purple-600 text-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-purple-100 text-sm">ຍອດເງິນສົດຄວນມອບ (System)</span>
            <span className="font-extrabold text-lg">{expectedCash.toLocaleString()} LAK</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-purple-500/30">
            <span className="text-purple-100 text-sm">ຍອດເງິນໂອນລວມ (Transfer)</span>
            <span className="font-extrabold text-lg">0 LAK</span>
          </div>
        </div>

        <form onSubmit={handleHandover} className="space-y-4">
          {/* Input Cash */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <label className="block text-sm font-bold text-gray-700">ເງິນສົດຕົວຈິງທີ່ນັບໄດ້ (LAK)</label>
            <input 
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-2xl font-extrabold text-gray-900"
              required
            />
          </div>

          {/* Discrepancy Alert */}
          {cashAmount !== '' && discrepancy !== 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-800 font-bold">
                <AlertCircle className="w-5 h-5" />
                <span>ຍອດເງິນບໍ່ກົງກັນ ({discrepancy > 0 ? `ເກີນ +${discrepancy.toLocaleString()}` : `ຂາດ ${discrepancy.toLocaleString()}`})</span>
              </div>
              <input 
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผลที่ยอดไม่ตรง..."
                className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 active:scale-95 transition-all text-lg shadow-sm flex items-center justify-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'ກຳລັງສົ່ງມອບ...' : 'ຢືນຢັນສົ່ງມອບເງິນໃຫ້ Manager'}</span>
          </button>
        </form>
      </main>
    </div>
  )
}