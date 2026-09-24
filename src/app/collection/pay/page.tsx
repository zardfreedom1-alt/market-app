'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Wallet, QrCode, Banknote, Check } from 'lucide-react'

// ປ່ຽນຈາກ export default ມາເປັນຟັງຊັນທຳມະດາ
function PaymentFormContent() {
  const searchParams = useSearchParams()
  const shopId = searchParams.get('shopId')
  const shopNo = searchParams.get('shopNo')
  const shopName = searchParams.get('name')
  const debt = parseFloat(searchParams.get('debt') || '0')

  const [amount, setAmount] = useState(debt.toString())
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH')
  const [referenceNo, setReferenceNo] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const payAmount = parseFloat(amount)
    if (!payAmount || payAmount <= 0) {
      alert('ກະລຸນາປ້ອນຈຳນວນເງິນໃຫ້ຖືກຕ້ອງ!')
      return
    }

    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()

    // 1. ບັນທຶກ Payment
    const { data: payData, error: payError } = await supabase
      .from('payments')
      .insert({
        shop_id: shopId,
        amount: payAmount,
        currency: 'LAK',
        payment_method: paymentMethod,
        reference_no: referenceNo || null,
        received_by: userData.user?.id,
        status: 'COMPLETED'
      })
      .select()
      .single()

    if (payError || !payData) {
      alert('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກການຈ່າຍເງິນ!')
      setLoading(false)
      return
    }

    // 2. ບັນທຶກລົງ Debt Ledger (ตัดหนี้ / บันทึกการจ่าย)
    const remainingBalance = debt - payAmount
    await supabase.from('debt_ledger').insert({
      shop_id: shopId,
      transaction_type: 'PAYMENT',
      reference_id: payData.id,
      initial_amount: debt,
      paid_amount: payAmount,
      balance_amount: remainingBalance > 0 ? remainingBalance : 0,
      note: `ຮັບຊຳລະຜ່ານ ${paymentMethod === 'CASH' ? 'ເງິນສົດ' : 'ໂອນເງິນ'}`
    })

    setLoading(false)
    
    // ເພີ່ມການຖາມເພື່ອສົ່ງ WhatsApp ຫຼັງຈາກບັນທຶກສຳເລັດ
    const wantReceipt = window.confirm('ບັນທຶກສຳເລັດ! ທ່ານຕ້ອງການສົ່ງໃບຮັບເງິນຜ່ານ WhatsApp ບໍ່?')
    if (wantReceipt) {
      import('@/utils/whatsapp').then(module => {
        module.sendWhatsAppReceipt(shopNo || 'ບໍ່ລະບຸ', payAmount, paymentMethod)
      })
    }
    
    router.push('/collection')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.push('/collection')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">ຮັບຊຳລະເງິນ: ຮ້ານ {shopNo}</h1>
        </div>
      </header>

      {/* Main Form */}
      <main className="p-4 max-w-xl mx-auto space-y-4">
        {/* Shop Info Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <p className="text-xs text-gray-500">ຊື່ຮ້ານ: <span className="font-bold text-gray-800">{shopName || 'ບໍ່มีຊື່'}</span></p>
          <p className="text-sm font-bold text-rose-600">ຍອດໜີ້ຄ້າງທັງໝົດ: {debt.toLocaleString()} LAK</p>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          {/* Method Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                paymentMethod === 'CASH' 
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold' 
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              <Banknote className="w-6 h-6" />
              <span>ເງິນສົດ (CASH)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('TRANSFER')}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                paymentMethod === 'TRANSFER' 
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              <QrCode className="w-6 h-6" />
              <span>ເງິນໂອນ (TRANSFER)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <label className="block text-sm font-bold text-gray-700">ຈຳນວນເງິນທີ່ຮັບຈິງ (LAK)</label>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none text-2xl font-extrabold text-gray-900"
              required
            />
            <p className="text-xs text-gray-500">* ຮອງຮັບການຈ່າຍບາງສ່ວນ (Partial Payment)</p>
          </div>

          {/* Transfer Reference */}
          {paymentMethod === 'TRANSFER' && (
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <label className="block text-sm font-bold text-gray-700">ເລກອ້າງອີງ / ລະຫັດສະລິບ</label>
              <input 
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="ພິມເລກອ້າງອີງການໂອນ..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-base"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all text-lg shadow-sm flex items-center justify-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>{loading ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນຮັບເງິນ ແລະ ອອກໃບຮັບເງິນ'}</span>
          </button>
        </form>
      </main>
    </div>
  )
}

// ສ້າງ default ໂຕໃໝ່ຂຶ້ນມາກວມດ້ວຍ Suspense
export default function PaymentFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນ...</div>}>
      <PaymentFormContent />
    </Suspense>
  )
}