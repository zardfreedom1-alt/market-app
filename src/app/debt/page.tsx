'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Receipt, Calendar, AlertCircle, CheckCircle2, Filter, FileDown, X, Banknote, CreditCard, Save, Layers } from 'lucide-react'

export default function DebtPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  
  // ໂໝດສະແດງຜົນ: 'ALL' (ທັງໝົດ) ຫຼື 'MONTHLY' (ສະເພາະເດືອນ)
  const [viewMode, setViewMode] = useState<'ALL' | 'MONTHLY'>('ALL')
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)
  
  const [debtRecords, setDebtRecords] = useState<any[]>([])
  
  const [currencyFilter, setCurrencyFilter] = useState('LAK')
  const [rentalTypeFilter, setRentalTypeFilter] = useState('ລາຍເດືອນ')

  // State ສຳລັບໜ້າຕ່າງຮັບຊຳລະໜີ້
  const [paymentModal, setPaymentModal] = useState({ 
    isOpen: false, shop: null as any, 
    payRent: '', paySecurity: '', method: 'CASH',
    forMonth: currentMonthStr // ໃຫ້ເລືອກໄດ້ວ່າຈ່າຍໜີ້ຂອງເດືອນໃດ
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDebtData()
  }, [viewMode, selectedMonth, currencyFilter, rentalTypeFilter])

  const fetchDebtData = async () => {
    setLoading(true)
    
    // 1. ດຶງຂໍ້ມູນຮ້ານ (ສົມມຸດວ່າມີການເພີ່ມ contract_start_date ໃນອະນາຄົດ, ຕອນນີ້ໃຊ້ created_at ແທນໄປກ່ອນ)
    const { data: shops } = await supabase
      .from('shops')
      .select('shop_number, tenant_name, rent_amount, security_fee, rental_type, currency, created_at')
      .eq('status', 'ກຳລັງເຊົ່າ')
      .eq('currency', currencyFilter)
      .eq('rental_type', rentalTypeFilter)
      .order('shop_number')

    // 2. ດຶງຂໍ້ມູນການຈ່າຍທັງໝົດ ເພື່ອມາຄຳນວນໜີ້ສະສົມ
    const { data: collections } = await supabase
      .from('collections')
      .select('shop_number, rent, security, for_month, collection_date')

    if (shops) {
      const records = shops.map(shop => {
        let expectedRent = 0
        let expectedSecurity = 0
        let shopCollections = []
        
        // ຫາເດືອນເລີ່ມຕົ້ນຂອງຮ້ານນີ້ (ຖ້າບໍ່ມີການຈ່າຍເງິນເລີຍ ໃຫ້ຖືເອົາເດືອນທີ່ສ້າງຮ້ານເປັນເດືອນເລີ່ມຕົ້ນ)
        const allShopCols = collections?.filter(c => c.shop_number === shop.shop_number) || []
        let startMonthStr = shop.created_at ? shop.created_at.slice(0, 7) : currentMonthStr
        
        allShopCols.forEach(c => {
          const m = c.for_month || c.collection_date.slice(0, 7)
          if (m < startMonthStr) startMonthStr = m
        })

        if (viewMode === 'ALL') {
          // --- ໂໝດໜີ້ລວມທັງໝົດ ---
          // ຄຳນວນເດືອນຕັ້ງແຕ່ເລີ່ມຕົ້ນ ຮອດເດືອນປັດຈຸບັນ
          const startD = new Date(startMonthStr + '-01')
          const nowD = new Date(currentMonthStr + '-01')
          let monthsCount = (nowD.getFullYear() - startD.getFullYear()) * 12 + nowD.getMonth() - startD.getMonth() + 1
          if (monthsCount < 1) monthsCount = 1

          let multiplier = shop.rental_type === 'ລາຍປີ' ? Math.ceil(monthsCount / 12) : monthsCount

          expectedRent = (Number(shop.rent_amount) || 0) * multiplier
          expectedSecurity = (Number(shop.security_fee) || 0) * multiplier
          shopCollections = allShopCols

        } else {
          // --- ໂໝດແຍກຕາມເດືອນ ---
          // ກັ່ນຕອງເອົາສະເພາະບິນທີ່ຈ່າຍໃຫ້ "ເດືອນທີ່ເລືອກ" ເທົ່ານັ້ນ
          shopCollections = allShopCols.filter(c => {
            const m = c.for_month || c.collection_date.slice(0, 7)
            return m === selectedMonth
          })
          
          // ເປົ້າໝາຍໃນເດືອນນັ້ນ ກໍຄືເປົ້າໝາຍປົກກະຕິ 1 ເດືອນ (ຫຼື 1 ປີ)
          expectedRent = Number(shop.rent_amount) || 0
          expectedSecurity = Number(shop.security_fee) || 0
          
          // *ຈຸດສຳຄັນ: ຖ້າຮ້ານນີ້ເລີ່ມເຊົ່າຫຼັງຈາກເດືອນທີ່ເລືອກ (ເຊັ່ນ: ເລືອກເດືອນ 1 ແຕ່ຮ້ານເລີ່ມເຊົ່າເດືອນ 3)
          // ບໍ່ໃຫ້ສະແດງເປົ້າໝາຍໜີ້ໃນເດືອນນັ້ນ
          if (startMonthStr > selectedMonth) {
            expectedRent = 0
            expectedSecurity = 0
          }
        }

        const paidRent = shopCollections.reduce((sum, c) => sum + (Number(c.rent) || 0), 0)
        const paidSecurity = shopCollections.reduce((sum, c) => sum + (Number(c.security) || 0), 0)
        const totalPaid = paidRent + paidSecurity
        
        const expectedTotal = expectedRent + expectedSecurity
        const debt = expectedTotal - totalPaid

        return {
          shop_number: shop.shop_number,
          tenant_name: shop.tenant_name,
          expectedRent, expectedSecurity, expectedTotal,
          paidRent, paidSecurity, totalPaid,
          debt: debt > 0 ? debt : 0,
          currency: shop.currency,
          rental_type: shop.rental_type
        }
      })
      setDebtRecords(records)
    }
    setLoading(false)
  }

  // ຟັງຊັນດາວໂຫຼດ CSV
  const handleDownloadCSV = () => {
    let csvContent = "\uFEFF"
    csvContent += "ຮູບແບບ,ເລກຫ້ອງ,ຊື່ຮ້ານ,ປະເພດ,ສະກຸນເງິນ,ໜີ້ຄ່າເຊົ່າ,ໜີ້ຄ່າຍາມ,ໜີ້ຄ້າງລວມ\n"

    const periodLabel = viewMode === 'ALL' ? 'ໜີ້ລວມທັງໝົດສະສົມ' : `ໜີ້ປະຈຳເດືອນ ${selectedMonth}`

    debtRecords.filter(r => r.debt > 0).forEach(shop => {
      const debtRent = shop.expectedRent - shop.paidRent
      const debtSec = shop.expectedSecurity - shop.paidSecurity
      csvContent += `"${periodLabel}","${shop.shop_number}","${shop.tenant_name || 'ບໍ່ມີຊື່'}","${shop.rental_type}","${shop.currency}","${debtRent > 0 ? debtRent : 0}","${debtSec > 0 ? debtSec : 0}","${shop.debt}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `ລາຍງານໜີ້ຄ້າງ_${viewMode === 'ALL' ? 'ລວມທັງໝົດ' : selectedMonth}_${currencyFilter}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openPaymentModal = (record: any) => {
    const debtRent = record.expectedRent - record.paidRent
    const debtSec = record.expectedSecurity - record.paidSecurity
    setPaymentModal({
      isOpen: true,
      shop: record,
      // ປ່ຽນຈາກ .toString() ເປັນ .toLocaleString('en-US') 
      payRent: debtRent > 0 ? debtRent.toLocaleString('en-US') : '',
      paySecurity: debtSec > 0 ? debtSec.toLocaleString('en-US') : '',
      method: 'CASH',
      forMonth: viewMode === 'MONTHLY' ? selectedMonth : currentMonthStr
    })
  }

  const handlePayDebt = async () => {
    if (!paymentModal.shop) return
    
    // ເພີ່ມ .toString().replace(/,/g, '') ເພື່ອຕັດຈຸດອອກກ່ອນແປງເປັນຕົວເລກ
    const rentAmt = Number(paymentModal.payRent.toString().replace(/,/g, '')) || 0
    const secAmt = Number(paymentModal.paySecurity.toString().replace(/,/g, '')) || 0
    const totalAmt = rentAmt + secAmt

    if (totalAmt <= 0) return alert('ກະລຸນາປ້ອນຈຳນວນເງິນຢ່າງໜ້ອຍ 1 ລາຍການ!')

    setIsSubmitting(true)
    const today = new Date().toLocaleDateString('en-CA')

    const { error } = await supabase.from('collections').insert([{
      shop_number: paymentModal.shop.shop_number,
      collection_date: today, 
      for_month: paymentModal.forMonth, 
      rent: rentAmt,
      security: secAmt,
      total_amount: totalAmt,
      payment_method: paymentModal.method,
      other_note: `ຊຳລະໜີ້ຄ້າງຍ້ອນຫຼັງ ປະຈຳເດືອນ ${paymentModal.forMonth}`
    }])

    setIsSubmitting(false)

    if (error) {
      alert('ເກີດຂໍ້ຜິດພາດ: ' + error.message)
    } else {
      alert('ບັນທຶກການຮັບຊຳລະໜີ້ສຳເລັດ!')
      setPaymentModal({ ...paymentModal, isOpen: false })
      fetchDebtData()
    }
  }

  const totalExpected = debtRecords.reduce((sum, r) => sum + r.expectedTotal, 0)
  const totalPaid = debtRecords.reduce((sum, r) => sum + r.totalPaid, 0)
  const totalDebt = debtRecords.reduce((sum, r) => sum + r.debt, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-white px-4 py-3.5 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="bg-rose-100 p-1.5 rounded-lg text-rose-600">
            <Receipt className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">ບັນຊີໜີ້ຄ້າງຈ່າຍ</h1>
        </div>
      </header>

      <main className="p-4 max-w-3xl mx-auto w-full space-y-4">
        
        {/* ເຄື່ອງມືກັ່ນຕອງ ແລະ ປຸ່ມດາວໂຫຼດ */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-gray-50 pb-4">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('ALL')}
                className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center ${viewMode === 'ALL' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
              >
                <Layers className="w-4 h-4 mr-1.5" /> ໜີ້ລວມທັງໝົດ
              </button>
              <button 
                onClick={() => setViewMode('MONTHLY')}
                className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center ${viewMode === 'MONTHLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                <Calendar className="w-4 h-4 mr-1.5" /> ແຍກຕາມເດືອນ
              </button>
            </div>

            <button 
              onClick={handleDownloadCSV} 
              className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>ໂຫຼດລາຍງານ (CSV)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'MONTHLY' && (
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 bg-gray-50 rounded-xl outline-none border border-gray-200 font-bold text-gray-700 text-sm"
              />
            )}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 rounded-xl px-3 py-2 outline-none"
              >
                <option value="LAK">ສະກຸນເງິນ: ກີບ (LAK)</option>
                <option value="THB">ສະກຸນເງິນ: ບາດ (THB)</option>
              </select>
              <select 
                value={rentalTypeFilter}
                onChange={(e) => setRentalTypeFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 rounded-xl px-3 py-2 outline-none"
              >
                <option value="ລາຍເດືອນ">ປະເພດ: ລາຍເດືອນ</option>
                <option value="ລາຍປີ">ປະເພດ: ລາຍປີ</option>
              </select>
            </div>
          </div>
        </div>

        {/* ກາດສະຫຼຸບຍອດລວມ */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center text-center">
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 mb-1">ຈ່າຍມາແລ້ວ</span>
            <span className="text-sm sm:text-lg font-black text-emerald-500">{totalPaid.toLocaleString()}</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-2xl shadow-sm border border-rose-100 flex flex-col justify-center text-center">
            <span className="text-[10px] sm:text-xs font-bold text-rose-500 mb-1">ໜີ້ຄ້າງລວມ</span>
            <span className="text-sm sm:text-lg font-black text-rose-600">{totalDebt.toLocaleString()}</span>
          </div>
        </div>

        {/* ລາຍຊື່ໜີ້ຄ້າງແຕ່ລະຮ້ານ */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500 text-sm">ກຳລັງຄຳນວນໜີ້...</div>
          ) : debtRecords.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">ບໍ່ພົບຂໍ້ມູນຮ້ານທີ່ຕົງກັບເງື່ອນໄຂ</div>
          ) : (
            debtRecords.map((record, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-blue-600">{record.shop_number}</span>
                    <span className="text-sm text-gray-600 font-bold">{record.tenant_name || 'ບໍ່ມີຊື່'}</span>
                  </div>
                  {record.debt === 0 ? (
                    <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ຈ່າຍຄົບແລ້ວ
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> ຍັງຕິດໜີ້
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col text-sm space-y-3">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="space-y-1">
                      <p className="text-gray-500 text-xs">ຄ່າເຊົ່າ: <span className="text-gray-900 font-bold">{record.expectedRent.toLocaleString()}</span></p>
                      <p className="text-gray-500 text-xs">ຈ່າຍແລ້ວ: <span className="text-emerald-600 font-bold">{record.paidRent.toLocaleString()}</span></p>
                    </div>
                    <div className="space-y-1 border-l border-gray-200 pl-4">
                      <p className="text-gray-500 text-xs">ຄ່າຍາມ: <span className="text-gray-900 font-bold">{record.expectedSecurity.toLocaleString()}</span></p>
                      <p className="text-gray-500 text-xs">ຈ່າຍແລ້ວ: <span className="text-emerald-600 font-bold">{record.paidSecurity.toLocaleString()}</span></p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-1">
                    <div className="space-y-1">
                      <p className="text-gray-700 text-xs font-bold">ລວມຈ່າຍແລ້ວ: <span className="text-emerald-600">{record.totalPaid.toLocaleString()}</span></p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-xs text-rose-500 font-bold mb-0.5">ຍອດໜີ້ທີ່ຕ້ອງຈ່າຍ ({record.currency})</p>
                      <p className={`text-xl font-black ${record.debt > 0 ? 'text-rose-600' : 'text-gray-300'}`}>
                        {record.debt.toLocaleString()}
                      </p>
                      {record.debt > 0 && (
                        <button 
                          onClick={() => openPaymentModal(record)}
                          className="mt-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1.5" /> ຮັບຊຳລະໜີ້
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ---- Modal ຮັບຊຳລະໜີ້ຄ້າງຈ່າຍ ---- */}
        {paymentModal.isOpen && paymentModal.shop && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-gray-100">
              
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">ຮັບໜີ້ຮ້ານ: <span className="text-blue-600">{paymentModal.shop.shop_number}</span></h2>
                <button onClick={() => setPaymentModal({...paymentModal, isOpen: false})} className="p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-rose-600">ໜີ້ລວມສະສົມ:</span>
                  <span className="text-xl font-black text-rose-600">{paymentModal.shop.debt.toLocaleString()} {paymentModal.shop.currency}</span>
                </div>

                {/* ໃຫ້ເລືອກເດືອນທີ່ຈະລົບໜີ້ */}
                <div>
                  <label className="text-xs font-bold text-amber-600 mb-1 block">ຈ່າຍລົບລ້າງບິນຂອງເດືອນ:</label>
                  <input 
                    type="month" 
                    value={paymentModal.forMonth}
                    onChange={(e) => setPaymentModal({...paymentModal, forMonth: e.target.value})}
                    className="w-full p-2.5 bg-amber-50 text-amber-900 font-bold rounded-xl outline-none border border-amber-200 text-sm focus:border-amber-400"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">ຊຳລະຄ່າເຊົ່າ (ກຳນົດເອງໄດ້)</label>
                    <input 
                      type="text" 
                      value={paymentModal.payRent}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '') // ລຶບຈຸດອອກກ່ອນກວດສອບ
                        if (!isNaN(Number(val))) { // ກວດສອບວ່າເປັນຕົວເລກແທ້ບໍ່ (ປ້ອງກັນການພິມຕົວໜັງສື)
                          // ຖ້າເປັນຕົວເລກໃຫ້ແປງຮູບແບບໃສ່ຈຸດ ແລ້ວບັນທຶກລົງ State
                          setPaymentModal({...paymentModal, payRent: val ? Number(val).toLocaleString('en-US') : ''})
                        }
                      }}
                      className="w-full p-3 bg-gray-50 text-gray-900 font-bold text-lg rounded-xl outline-none border border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">ຊຳລະຄ່າຍາມ (ກຳນົດເອງໄດ້)</label>
                    <input 
                      type="text" 
                      value={paymentModal.paySecurity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '') // ລຶບຈຸດອອກກ່ອນກວດສອບ
                        if (!isNaN(Number(val))) { // ກວດສອບວ່າເປັນຕົວເລກແທ້ບໍ່
                          // ຖ້າເປັນຕົວເລກໃຫ້ແປງຮູບແບບໃສ່ຈຸດ ແລ້ວບັນທຶກລົງ State
                          setPaymentModal({...paymentModal, paySecurity: val ? Number(val).toLocaleString('en-US') : ''})
                        }
                      }}
                      className="w-full p-3 bg-gray-50 text-gray-900 font-bold text-lg rounded-xl outline-none border border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => setPaymentModal({...paymentModal, method: 'CASH'})} 
                    className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all font-bold ${paymentModal.method === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-400'}`}
                  >
                    <Banknote className="w-5 h-5 mr-2" /> ເງິນສົດ
                  </button>
                  <button 
                    onClick={() => setPaymentModal({...paymentModal, method: 'TRANSFER'})} 
                    className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all font-bold ${paymentModal.method === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-400'}`}
                  >
                    <CreditCard className="w-5 h-5 mr-2" /> ເງິນໂອນ
                  </button>
                </div>
                
                <button 
                  onClick={handlePayDebt}
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white p-3.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-md disabled:opacity-50"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກຮັບຊຳລະໜີ້'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}