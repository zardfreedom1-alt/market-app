'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Trash2, Calendar, AlertCircle, ClipboardList, Edit, TrendingDown, Save, X } from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // ເພີ່ມ Tab 'EXPENSES' ສຳລັບລາຍຈ່າຍ
  const [activeTab, setActiveTab] = useState<'COLLECTED' | 'PENDING' | 'EXPENSES'>('COLLECTED')
  const [collections, setCollections] = useState<any[]>([])
  const [pendingShops, setPendingShops] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  // State ສຳລັບ Modal ແກ້ໄຂລາຍຈ່າຍ
  const [editExpenseModal, setEditExpenseModal] = useState({
    isOpen: false, id: '', category: '', amount: '', currency: 'LAK', paymentMethod: 'CASH', note: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDailyStatus()
  }, [selectedDate])

  const fetchDailyStatus = async () => {
    setLoading(true)
    
    // 1. ດຶງຂໍ້ມູນການເກັບເງິນຂອງມື້ທີ່ເລືອກ
    const { data: cols } = await supabase
      .from('collections')
      .select('id, shop_number, rent, electricity, cleaning, security, other_amount, total_amount, payment_method, collection_date')
      .eq('collection_date', selectedDate)
      .order('created_at', { ascending: false })

    // 2. ດຶງລາຍຊື່ຮ້ານທີ່ກຳລັງເຊົ່າທັງໝົດ
    const { data: shops } = await supabase
      .from('shops')
      .select('shop_number, tenant_name')
      .eq('status', 'ກຳລັງເຊົ່າ')
      .order('shop_number')

    // 3. ດຶງຂໍ້ມູນລາຍຈ່າຍຂອງມື້ທີ່ເລືອກ
    const { data: exps } = await supabase
      .from('expenses')
      .select('*')
      .eq('expense_date', selectedDate)
      .order('created_at', { ascending: false })

    if (cols && shops) {
      const enrichedCols = cols.map(col => {
        const shopInfo = shops.find(s => s.shop_number === col.shop_number)
        return {
          ...col,
          tenant_name: shopInfo ? shopInfo.tenant_name : 'ບໍ່ມີຊື່'
        }
      })
      setCollections(enrichedCols)
      
      const collectedShopNumbers = cols.map(c => c.shop_number)
      const pending = shops.filter(s => !collectedShopNumbers.includes(s.shop_number))
      setPendingShops(pending)
    }

    if (exps) setExpenses(exps)

    setLoading(false)
  }

  // --- ຟັງຊັນສຳລັບລາຍຮັບ (ບິນ) ---
  const handleDeleteCollection = async (id: string, shopNumber: string) => {
    if (window.confirm(`ທ່ານຕ້ອງການລຶບບິນຂອງຮ້ານ ${shopNumber} ແທ້ບໍ່?`)) {
      const { error } = await supabase.from('collections').delete().eq('id', id)
      if (error) alert('ລຶບບໍ່ສຳເລັດ: ' + error.message)
      else fetchDailyStatus()
    }
  }

  // --- ຟັງຊັນສຳລັບລາຍຈ່າຍ (Expenses) ---
  const handleDeleteExpense = async (id: string, category: string) => {
    if (window.confirm(`ທ່ານຕ້ອງການລຶບລາຍຈ່າຍ: ${category} ແທ້ບໍ່?`)) {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) alert('ລຶບບໍ່ສຳເລັດ: ' + error.message)
      else fetchDailyStatus()
    }
  }

  const openEditExpense = (expense: any) => {
    setEditExpenseModal({
      isOpen: true,
      id: expense.id,
      category: expense.category,
      amount: expense.amount.toLocaleString('en-US'),
      currency: expense.currency,
      paymentMethod: expense.payment_method,
      note: expense.note || ''
    })
  }

  const handleUpdateExpense = async () => {
    const numAmount = Number(editExpenseModal.amount.replace(/,/g, ''))
    if (numAmount <= 0) return alert('ກະລຸນາປ້ອນຈຳນວນເງິນ!')

    setIsSubmitting(true)
    const { error } = await supabase.from('expenses').update({
      category: editExpenseModal.category,
      amount: numAmount,
      currency: editExpenseModal.currency,
      payment_method: editExpenseModal.paymentMethod,
      note: editExpenseModal.note
    }).eq('id', editExpenseModal.id)
    
    setIsSubmitting(false)

    if (error) {
      alert('ແກ້ໄຂບໍ່ສຳເລັດ: ' + error.message)
    } else {
      setEditExpenseModal({ ...editExpenseModal, isOpen: false })
      fetchDailyStatus()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-white px-4 py-3.5 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl mr-3">
          <ArrowLeft className="w-5 h-5"/>
        </button>
        <div className="flex items-center space-x-2">
          <div className="bg-teal-100 p-1.5 rounded-lg text-teal-600">
            <ClipboardList className="w-5 h-5"/>
          </div>
          <h1 className="text-lg font-bold text-gray-900">ປະຫວັດ & ແກ້ໄຂບິນ</h1>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto w-full space-y-4">
        
        {/* ເລືອກວັນທີ */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3 max-w-3xl">
          <Calendar className="w-5 h-5 text-gray-400"/>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 p-2 bg-gray-50 rounded-xl outline-none border border-gray-200 font-bold text-gray-700"
          />
        </div>

        {/* ປຸ່ມສັບປ່ຽນແຖບ (Tabs) ອັບເດດເປັນ 3 ແຖບ */}
        <div className="flex bg-gray-200 p-1 rounded-xl max-w-3xl">
          <button 
            onClick={() => setActiveTab('COLLECTED')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'COLLECTED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
          >
            ຮັບແລ້ວ ({collections.length})
          </button>
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'PENDING' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
          >
            ຍັງບໍ່ເກັບ ({pendingShops.length})
          </button>
          <button 
            onClick={() => setActiveTab('EXPENSES')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'EXPENSES' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
          >
            ລາຍຈ່າຍ ({expenses.length})
          </button>
        </div>

        {/* ເນື້ອຫາຂອງແຖບ */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">ກຳລັງໂຫຼດຂໍ້ມູນ...</div>
          ) : activeTab === 'COLLECTED' ? (
            // --- ແຖບເກັບແລ້ວ (Table) ---
            collections.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100 max-w-3xl">ຍັງບໍ່ມີຂໍ້ມູນການເກັບເງິນໃນມື້ນີ້</div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="border-b border-gray-100 text-gray-500 font-medium text-xs">
                      <tr>
                        <th className="px-4 py-4 bg-emerald-50/50">ວັນທີ</th>
                        <th className="px-4 py-4 bg-emerald-50/50 text-center">ຫ້ອງ</th>
                        <th className="px-4 py-4 bg-emerald-50/50">ຊື່ຮ້ານ</th>
                        <th className="px-4 py-4 text-right">ລວມເງິນ</th>
                        <th className="px-4 py-4 text-center">ຈັດການ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {collections.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5 text-gray-600">{record.collection_date}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-block bg-gray-800 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                              {record.shop_number}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-700 font-medium">{record.tenant_name}</td>
                          <td className="px-4 py-3.5 text-right font-medium text-emerald-600">
                            + {Number(record.total_amount).toLocaleString()} ກີບ
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex justify-center space-x-3">
                              <button 
                                onClick={() => handleDeleteCollection(record.id, record.shop_number)} 
                                className="text-gray-400 hover:text-rose-500 transition-colors" 
                                title="ລຶບ"
                              >
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : activeTab === 'PENDING' ? (
            // --- ແຖບຍັງບໍ່ໄດ້ເກັບ ---
            pendingShops.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100 max-w-3xl">ເກັບຄົບທຸກຮ້ານແລ້ວ! 🎉</div>
            ) : (
              <div className="max-w-3xl space-y-3">
                {pendingShops.map((shop, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-rose-500"/>
                        <span className="font-extrabold text-gray-900">{shop.shop_number}</span>
                      </div>
                      <p className="text-sm text-gray-500">{shop.tenant_name || 'ບໍ່ມີຊື່ຜູ້ເຊົ່າ'}</p>
                    </div>
                    <button 
                      onClick={() => router.push('/collection')}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-xl"
                    >
                      ໄປໜ້າເກັບເງິນ
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            // --- ແຖບລາຍຈ່າຍ (Expenses) ໃໝ່ ---
            expenses.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-100 max-w-3xl">ບໍ່ມີລາຍຈ່າຍໃນມື້ນີ້</div>
            ) : (
              <div className="max-w-3xl space-y-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-4 h-4 text-orange-500"/>
                        <span className="font-extrabold text-gray-900">{exp.category}</span>
                      </div>
                      <p className="text-sm text-gray-500">ໝາຍເຫດ: {exp.note || '-'}</p>
                      <p className="text-xs text-gray-400">ຈ່າຍດ້ວຍ: {exp.payment_method}</p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <span className="font-black text-rose-500 text-lg">
                        - {Number(exp.amount).toLocaleString()} {exp.currency}
                      </span>
                      <div className="flex space-x-3 mt-2">
                        <button 
                          onClick={() => openEditExpense(exp)} 
                          className="text-gray-400 hover:text-blue-500 transition-colors flex items-center text-xs font-bold" 
                        >
                          <Edit className="w-3 h-3 mr-1"/> ແກ້ໄຂ
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id, exp.category)} 
                          className="text-gray-400 hover:text-rose-500 transition-colors flex items-center text-xs font-bold" 
                        >
                          <Trash2 className="w-3 h-3 mr-1"/> ລຶບ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* --- Modal ແກ້ໄຂລາຍຈ່າຍ --- */}
        {editExpenseModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-blue-500"/> ແກ້ໄຂລາຍຈ່າຍ
                </h2>
                <button onClick={() => setEditExpenseModal({...editExpenseModal, isOpen: false})} className="p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">ໝວດໝູ່ລາຍຈ່າຍ</label>
                  <input 
                    type="text" 
                    value={editExpenseModal.category}
                    onChange={(e) => setEditExpenseModal({...editExpenseModal, category: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 text-gray-900 font-bold rounded-xl outline-none border border-gray-200"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <div className="flex-[2]">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">ຈຳນວນເງິນ</label>
                    <input 
                      type="text" 
                      value={editExpenseModal.amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '')
                        if (!isNaN(Number(val))) {
                          setEditExpenseModal({...editExpenseModal, amount: val ? Number(val).toLocaleString('en-US') : ''})
                        }
                      }}
                      className="w-full p-2.5 bg-orange-50 text-orange-600 font-black rounded-xl outline-none border border-orange-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 mb-1 block">ສະກຸນເງິນ</label>
                    <select 
                      value={editExpenseModal.currency}
                      onChange={(e) => setEditExpenseModal({...editExpenseModal, currency: e.target.value})}
                      className="w-full p-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl outline-none border border-blue-200"
                    >
                      <option value="LAK">LAK</option>
                      <option value="THB">THB</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">ໝາຍເຫດ</label>
                  <input 
                    type="text" 
                    value={editExpenseModal.note}
                    onChange={(e) => setEditExpenseModal({...editExpenseModal, note: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 text-gray-900 text-sm rounded-xl outline-none border border-gray-200"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <select 
                    value={editExpenseModal.paymentMethod}
                    onChange={(e) => setEditExpenseModal({...editExpenseModal, paymentMethod: e.target.value})}
                    className="flex-1 p-2.5 bg-gray-50 font-bold rounded-xl outline-none border border-gray-200"
                  >
                    <option value="CASH">ເງິນສົດ (CASH)</option>
                    <option value="TRANSFER">ເງິນໂອນ (TRANSFER)</option>
                  </select>
                </div>

                <button 
                  onClick={handleUpdateExpense}
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white p-3.5 rounded-xl font-bold flex items-center justify-center transition-all"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການແກ້ໄຂ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}