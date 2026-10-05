'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, BarChart3, CalendarDays, FileDown } from 'lucide-react'
import * as XLSX from 'xlsx' // 📍 Import Library ສຳລັບ Excel

export default function ReportsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [startMonth, setStartMonth] = useState(currentMonth)
  const [endMonth, setEndMonth] = useState(currentMonth)

  const [summary, setSummary] = useState({
    incomeLAK: 0, incomeTHB: 0,
    recoveredLAK: 0, recoveredTHB: 0, 
    expenseLAK: 0, expenseTHB: 0,
    debtLAK: 0, debtTHB: 0,
    // ເກັບຍອດລວມແຕ່ລະປະເພດສຳລັບ Sheet ສະຫຼຸບ
    totalRentLAK: 0, totalRentTHB: 0,
    totalElecLAK: 0, totalElecTHB: 0,
    totalCleanLAK: 0, totalCleanTHB: 0,
    totalSecLAK: 0, totalSecTHB: 0
  })

  const [reportDetails, setReportDetails] = useState<any[]>([])
  const [expenseList, setExpenseList] = useState<any[]>([]) // ເກັບລາຍລະອຽດລາຍຈ່າຍ

  useEffect(() => {
    fetchSummaryData()
  }, [startMonth, endMonth])

  const fetchSummaryData = async () => {
    setLoading(true)
    const startDate = `${startMonth}-01`
    
    const [year, month] = endMonth.split('-')
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    const endDate = `${endMonth}-${lastDay}`

    const { data: collections } = await supabase
      .from('collections')
      .select('shop_number, rent, electricity, cleaning, security, other_amount, total_amount, payment_method, collection_date, for_month')
      .gte('collection_date', startDate)
      .lte('collection_date', endDate)

    const { data: shops } = await supabase
      .from('shops')
      .select('shop_number, tenant_name, rent_amount, security_fee, currency, rental_type')
      .eq('status', 'ກຳລັງເຊົ່າ')
      .order('shop_number')

    const { data: expenses } = await supabase
      .from('expenses')
      .select('category, amount, currency, expense_date, note')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date')

    if (expenses) setExpenseList(expenses)

    let incLAK = 0, incTHB = 0
    let recLAK = 0, recTHB = 0 
    let dbtLAK = 0, dbtTHB = 0
    let expLAK = expenses?.filter(e => e.currency === 'LAK').reduce((sum, e) => sum + Number(e.amount), 0) || 0
    let expTHB = expenses?.filter(e => e.currency === 'THB').reduce((sum, e) => sum + Number(e.amount), 0) || 0
    
    // ຍອດລວມແຕ່ລະປະເພດ
    let tRentLAK = 0, tRentTHB = 0
    let tElecLAK = 0, tElecTHB = 0
    let tCleanLAK = 0, tCleanTHB = 0
    let tSecLAK = 0, tSecTHB = 0

    let detailsArray: any[] = []

    if (shops) {
      shops.forEach(shop => {
        const currency = shop.currency || 'LAK'
        const rentalType = shop.rental_type || 'ລາຍເດືອນ'
        
        const expectedRent = Number(shop.rent_amount) || 0
        const expectedSecurity = Number(shop.security_fee) || 0
        const expectedTotal = expectedRent + expectedSecurity
        
        const shopCols = collections?.filter(c => c.shop_number === shop.shop_number) || []
        
        let paidRentThisMonth = 0
        let paidElectricityThisMonth = 0
        let paidCleaningThisMonth = 0
        let paidSecurityThisMonth = 0

        shopCols.forEach(c => {
          const amt = Number(c.total_amount) || 0
          const colMonth = c.collection_date.slice(0, 7) 
          const forMonth = c.for_month || colMonth       
          
          if (forMonth < colMonth) { 
            if (currency === 'LAK') recLAK += amt
            if (currency === 'THB') recTHB += amt
          } else {
            if (currency === 'LAK') incLAK += amt
            if (currency === 'THB') incTHB += amt
          }

          if (forMonth === startMonth) {
             paidRentThisMonth += (Number(c.rent) || 0)
             paidElectricityThisMonth += (Number(c.electricity) || 0)
             paidCleaningThisMonth += (Number(c.cleaning) || 0)
             paidSecurityThisMonth += (Number(c.security) || 0)
          }
        })

        // ບວກຍອດລວມປະເພດ
        if (currency === 'LAK') {
          tRentLAK += paidRentThisMonth; tElecLAK += paidElectricityThisMonth; tCleanLAK += paidCleaningThisMonth; tSecLAK += paidSecurityThisMonth;
        } else {
          tRentTHB += paidRentThisMonth; tElecTHB += paidElectricityThisMonth; tCleanTHB += paidCleaningThisMonth; tSecTHB += paidSecurityThisMonth;
        }

        const debtRent = expectedRent - paidRentThisMonth
        const debtSecurity = expectedSecurity - paidSecurityThisMonth
        const totalDebt = expectedTotal - (paidRentThisMonth + paidSecurityThisMonth)
        
        if (currency === 'LAK' && totalDebt > 0) dbtLAK += totalDebt
        if (currency === 'THB' && totalDebt > 0) dbtTHB += totalDebt

        detailsArray.push({
          shop_number: shop.shop_number,
          tenant_name: shop.tenant_name || 'ບໍ່ມີຊື່',
          type_currency: `${rentalType} (${currency})`,
          currency: currency, // ເກັບສະກຸນເງິນແຍກໄວ້ສຳລັບ Excel
          paid_rent: paidRentThisMonth,
          paid_electricity: paidElectricityThisMonth,
          paid_cleaning: paidCleaningThisMonth,
          paid_security: paidSecurityThisMonth,
          debt_rent: debtRent > 0 ? debtRent : 0,
          debt_security: debtSecurity > 0 ? debtSecurity : 0,
        })
      })
    }

    setSummary({
      incomeLAK: incLAK, incomeTHB: incTHB,
      recoveredLAK: recLAK, recoveredTHB: recTHB,
      expenseLAK: expLAK, expenseTHB: expTHB,
      debtLAK: dbtLAK, debtTHB: dbtTHB,
      totalRentLAK: tRentLAK, totalRentTHB: tRentTHB,
      totalElecLAK: tElecLAK, totalElecTHB: tElecTHB,
      totalCleanLAK: tCleanLAK, totalCleanTHB: tCleanTHB,
      totalSecLAK: tSecLAK, totalSecTHB: tSecTHB
    })
    
    setReportDetails(detailsArray)
    setLoading(false)
  }

  const profitLAK = (summary.incomeLAK + summary.recoveredLAK) - summary.expenseLAK
  const profitTHB = (summary.incomeTHB + summary.recoveredTHB) - summary.expenseTHB

  // 📍 ຟັງຊັນສ້າງ Excel ມີຫຼາຍ Sheet
  const handleDownloadExcel = () => {
    // --- Sheet 1: ລາຍລະອຽດຮ້ານค้า ---
    const detailRows: any[] = []
    reportDetails.forEach(shop => {
      detailRows.push({
        'ເລກທີ': shop.shop_number,
        'ຊື່': shop.tenant_name,
        'ປະເພດ': shop.type_currency,
        'ລາຍການ': 'ຄ່າເຊົ່າຮ້ານ',
        'ຈຳນວນເງິນ': shop.paid_rent || '-',
        'ໜີ້ຄ້າງຈ່າຍ': shop.debt_rent || '-'
      })
      detailRows.push({ 'ເລກທີ': '', 'ຊື່': '', 'ປະເພດ': '', 'ລາຍການ': 'ຄ່າໄຟ', 'ຈຳນວນເງິນ': shop.paid_electricity || '-', 'ໜີ້ຄ້າງຈ່າຍ': '-' })
      detailRows.push({ 'ເລກທີ': '', 'ຊື່': '', 'ປະເພດ': '', 'ລາຍການ': 'ຄ່າຂີ້ເຫຍື້ອ', 'ຈຳນວນເງິນ': shop.paid_cleaning || '-', 'ໜີ້ຄ້າງຈ່າຍ': '-' })
      detailRows.push({ 'ເລກທີ': '', 'ຊື່': '', 'ປະເພດ': '', 'ລາຍການ': 'ຄ່າຍາມ', 'ຈຳນວນເງິນ': shop.paid_security || '-', 'ໜີ້ຄ້າງຈ່າຍ': shop.debt_security || '-' })
      detailRows.push({ 'ເລກທີ': '', 'ຊື່': '', 'ປະເພດ': '', 'ລາຍການ': '', 'ຈຳນວນເງິນ': '', 'ໜີ້ຄ້າງຈ່າຍ': '' }) // ແຖວວ່າງຂັ້ນ
    })
    const wsDetails = XLSX.utils.json_to_sheet(detailRows)

    // --- Sheet 2: ສະຫຼຸບລາຍຮັບ-ໜີ້ສິນ ---
    const summaryRows = [
      { 'ລາຍການສະຫຼຸບ': 'ລາຍຮັບລວມ ຄ່າເຊົ່າຮ້ານ', 'ສະກຸນເງິນ ກີບ (LAK)': summary.totalRentLAK, 'ສະກຸນເງິນ ບາດ (THB)': summary.totalRentTHB },
      { 'ລາຍການສະຫຼຸບ': 'ລາຍຮັບລວມ ຄ່າໄຟຟ້າ', 'ສະກຸນເງິນ ກີບ (LAK)': summary.totalElecLAK, 'ສະກຸນເງິນ ບາດ (THB)': summary.totalElecTHB },
      { 'ລາຍການສະຫຼຸບ': 'ລາຍຮັບລວມ ຄ່າຂີ້ເຫຍື້ອ', 'ສະກຸນເງິນ ກີບ (LAK)': summary.totalCleanLAK, 'ສະກຸນເງິນ ບາດ (THB)': summary.totalCleanTHB },
      { 'ລາຍການສະຫຼຸບ': 'ລາຍຮັບລວມ ຄ່າຍາມ', 'ສະກຸນເງິນ ກີບ (LAK)': summary.totalSecLAK, 'ສະກຸນເງິນ ບາດ (THB)': summary.totalSecTHB },
      { 'ລາຍການສະຫຼຸບ': 'ເກັບໜີ້ຍ້ອນຫຼັງໄດ້', 'ສະກຸນເງິນ ກີບ (LAK)': summary.recoveredLAK, 'ສະກຸນເງິນ ບາດ (THB)': summary.recoveredTHB },
      { 'ລາຍການສະຫຼຸບ': '', 'ສະກຸນເງິນ ກີບ (LAK)': '', 'ສະກຸນເງິນ ບາດ (THB)': '' },
      { 'ລາຍການສະຫຼຸບ': 'ລວມລາຍຮັບທັງໝົດ', 'ສະກຸນເງິນ ກີບ (LAK)': summary.incomeLAK + summary.recoveredLAK, 'ສະກຸນເງິນ ບາດ (THB)': summary.incomeTHB + summary.recoveredTHB },
      { 'ລາຍການສະຫຼຸບ': 'ລວມໜີ້ຄ້າງຈ່າຍທັງໝົດ', 'ສະກຸນເງິນ ກີບ (LAK)': summary.debtLAK, 'ສະກຸນເງິນ ບາດ (THB)': summary.debtTHB },
      { 'ລາຍການສະຫຼຸບ': 'ກຳໄລສຸດທິ (ຫຼັງຫັກລາຍຈ່າຍ)', 'ສະກຸນເງິນ ກີບ (LAK)': profitLAK, 'ສະກຸນເງິນ ບາດ (THB)': profitTHB }
    ]
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)

    // --- Sheet 3: ລາຍຈ່າຍ ---
    const expenseRows = expenseList.map(exp => ({
      'ວັນທີຈ່າຍ': exp.expense_date,
      'ໝວດໝູ່': exp.category,
      'ໝາຍເຫດ': exp.note || '-',
      'ຈຳນວນເງິນ': exp.amount,
      'ສະກຸນເງິນ': exp.currency
    }))
    expenseRows.push({ 'ວັນທີຈ່າຍ': 'ລວມລາຍຈ່າຍ', 'ໝວດໝູ່': '', 'ໝາຍເຫດ': 'ກີບ (LAK)', 'ຈຳນວນເງິນ': summary.expenseLAK, 'ສະກຸນເງິນ': 'LAK' })
    expenseRows.push({ 'ວັນທີຈ່າຍ': '', 'ໝວດໝູ່': '', 'ໝາຍເຫດ': 'ບາດ (THB)', 'ຈຳນວນເງິນ': summary.expenseTHB, 'ສະກຸນເງິນ': 'THB' })
    const wsExpenses = XLSX.utils.json_to_sheet(expenseRows)

    // ສ້າງ Workbook ແລະ ເພີ່ມ Sheet ຕ່າງໆ
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsDetails, "ລາຍລະອຽດຮ້ານ")
    XLSX.utils.book_append_sheet(wb, wsSummary, "ສະຫຼຸບລາຍຮັບ-ໜີ້")
    XLSX.utils.book_append_sheet(wb, wsExpenses, "ລາຍຈ່າຍ")

    // ສັ່ງດາວໂຫຼດໄຟລ໌ Excel
    XLSX.writeFile(wb, `ລາຍງານ_${startMonth}_ຫາ_${endMonth}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-white px-4 py-3.5 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">ລາຍງານ & Export</h1>
      </header>

      <main className="p-4 max-w-6xl mx-auto w-full space-y-6 mt-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-2 text-gray-800">
              <BarChart3 className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-bold">ບົດສະຫຼຸບລາຍຮັບ-ລາຍຈ່າຍ</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-600">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span>ຕັ້ງແຕ່ເດືອນ:</span>
                <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="bg-transparent outline-none text-gray-900 cursor-pointer" />
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span>ຮອດເດືອນ:</span>
                <input type="month" value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="bg-transparent outline-none text-gray-900 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {/* 📍 ປ່ຽນປຸ່ມໃຫ້ເປັນດາວໂຫຼດ Excel */}
            <button 
              onClick={handleDownloadExcel}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              <span>ດາວໂຫຼດລາຍງານ (Excel 3 Sheet)</span>
            </button>
          </div>
        </div>

        {/* ຂໍ້ມູນ Card ສະຫຼຸບຕ່າງໆ ຍັງຄົງຄືເກົ່າ */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-bold">ກຳລັງຄຳນວນຂໍ້ມູນ...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border-t-4 border-t-emerald-500 border-x border-b border-gray-100 overflow-hidden">
              <div className="p-4 text-center border-b border-gray-50"><h3 className="text-gray-600 font-bold">ລາຍຮັບລວມທັງໝົດ</h3></div>
              <div className="p-4 space-y-3 bg-white">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">ລາຍຮັບປົກກະຕິ:</span>
                  <span className="text-emerald-600 font-bold">LAK: {summary.incomeLAK.toLocaleString()} / THB: {summary.incomeTHB.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-600">ເກັບໜີ້ຍ້ອນຫຼັງໄດ້:</span>
                  <span className="text-amber-600 font-bold">LAK: {summary.recoveredLAK.toLocaleString()} / THB: {summary.recoveredTHB.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2">
                  <span className="text-gray-900 font-bold">ລວມເງິນເຂົ້າຈິງ:</span>
                  <div className="text-right">
                    <p className="text-emerald-500 font-black text-base">LAK: {(summary.incomeLAK + summary.recoveredLAK).toLocaleString()}</p>
                    <p className="text-blue-500 font-black text-base">THB: {(summary.incomeTHB + summary.recoveredTHB).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-t-4 border-t-rose-500 border-x border-b border-gray-100 overflow-hidden">
              <div className="p-4 text-center border-b border-gray-50"><h3 className="text-gray-600 font-bold">ລາຍຈ່າຍທັງໝົດ</h3></div>
              <div className="p-4 space-y-3 bg-white">
                <div className="flex justify-between items-center text-sm border-b border-gray-100 border-dashed pb-2">
                  <span className="text-rose-700 font-bold">ກີບ:</span><span className="text-rose-500 font-black">- {summary.expenseLAK.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-rose-700 font-bold">ບາດ:</span><span className="text-rose-500 font-black">- {summary.expenseTHB.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl shadow-sm border-t-4 border-t-blue-500 border-x border-b border-blue-100 overflow-hidden">
              <div className="p-4 text-center border-b border-blue-100"><h3 className="text-gray-800 font-extrabold">ກຳໄລສຸດທິ</h3></div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-blue-200 border-dashed pb-2">
                  <span className="text-gray-700 font-bold">ກີບ:</span><span className="text-blue-600 font-black">{profitLAK >= 0 ? '+' : ''} {profitLAK.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-bold">ບາດ:</span><span className="text-blue-600 font-black">{profitTHB >= 0 ? '+' : ''} {profitTHB.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl shadow-sm border-t-4 border-t-orange-500 border-x border-b border-orange-100 overflow-hidden">
              <div className="p-4 text-center border-b border-orange-100"><h3 className="text-orange-900 font-extrabold">ໜີ້ຄ້າງຈ່າຍລວມ</h3></div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-orange-200 border-dashed pb-2">
                  <span className="text-orange-800 font-bold">ກີບ:</span><span className="text-rose-600 font-black">{summary.debtLAK.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-orange-800 font-bold">ບາດ:</span><span className="text-rose-600 font-black">{summary.debtTHB.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}