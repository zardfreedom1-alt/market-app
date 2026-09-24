'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ArrowLeft, Download, BarChart3, Calendar } from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()
  const [reportType, setReportType] = useState<'DAILY' | 'MONTHLY'>('DAILY')

  // ຕົວຢ່າງຂໍ້ມູນລາຍງານ (ໃນລະບົບຈິງຈະດຶງມາຈາກການ Sum ຕາຕະລາງ payments)
  const mockData = {
    totalRevenue: 4500000,
    totalCash: 2500000,
    totalTransfer: 2000000,
    transactionCount: 45,
    collectedShops: 42,
  }

  // ຟັງຊັນສຳລັບ Export CSV (ເປີດໃນ Excel ໄດ້)
  const handleExportExcel = () => {
    // ສ້າງຂໍ້ມູນ Mock ສຳລັບ Export
    const csvRows = [
      ['ວັນທີ', 'ປະເພດ', 'ເງິນສົດ (LAK)', 'ເງິນໂອນ (LAK)', 'ລວມ (LAK)'],
      ['2026-09-24', 'ລາຍຮັບປະຈຳວັນ', '2500000', '2000000', '4500000'],
    ]

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + csvRows.map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `report_${reportType}_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          <h1 className="text-lg font-bold text-gray-900">ລາຍງານ & ສະຫຼຸບຍອດ</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Toggle Report Type */}
        <div className="flex bg-gray-200 p-1 rounded-xl">
          <button
            onClick={() => setReportType('DAILY')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              reportType === 'DAILY' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ລາຍວັນ
          </button>
          <button
            onClick={() => setReportType('MONTHLY')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              reportType === 'MONTHLY' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ລາຍເດືອນ
          </button>
        </div>

        {/* Summary Cards */}
        <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-200 text-sm font-medium">ລາຍຮັບລວມ ({reportType === 'DAILY' ? 'ມື້ນີ້' : 'ເດືອນນີ້'})</p>
              <h2 className="text-3xl font-extrabold mt-1">{mockData.totalRevenue.toLocaleString()} LAK</h2>
            </div>
            <div className="p-2 bg-indigo-500/50 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="mt-5 pt-4 border-t border-indigo-500/50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-indigo-200 text-xs">ເງິນສົດ</p>
              <p className="font-bold">{mockData.totalCash.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs">ເງິນໂອນ</p>
              <p className="font-bold">{mockData.totalTransfer.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExportExcel}
            className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col items-center justify-center space-y-2 hover:border-emerald-500 hover:text-emerald-600 transition-all text-gray-700"
          >
            <Download className="w-6 h-6" />
            <span className="font-bold text-sm">Export Excel (CSV)</span>
          </button>

          <button 
            onClick={() => alert('ກຳລັງພັດທະນາການອອກແບບ PDF')}
            className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs flex flex-col items-center justify-center space-y-2 hover:border-rose-500 hover:text-rose-600 transition-all text-gray-700"
          >
            <FileText className="w-6 h-6" />
            <span className="font-bold text-sm">Export PDF</span>
          </button>
        </div>
      </main>
    </div>
  )
}