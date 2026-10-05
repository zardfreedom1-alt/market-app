'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Store, 
  Wallet, 
  Receipt, 
  FileText, 
  LogOut, 
  ChevronRight,
  Building2,
  ClipboardList,
  TrendingDown // ເພີ່ມ Icon ນີ້ເຂົ້າມາສຳລັບເມນູລາຍຈ່າຍ
} from 'lucide-react'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  
  // State ສຳລັບເກັບຂໍ້ມູນສະຖິຕິໃນບັດສີຟ້າ
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalCash: 0,
    totalTransfer: 0,
    collectedCount: 0,
    pendingCount: 0,
    totalShops: 0
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? null)
        
        if (user.email === 'zard.freedom1@gmail.com') {
          setCurrentUserRole('MANAGER')
          fetchDashboardStats() // ດຶງສະຖິຕິສະເພາະ Manager
        } else {
          setCurrentUserRole('CASHIER')
        }
      }
    }
    getUser()
  }, [supabase])

  // ຟັງຊັນຄຳນວນຍອດເງິນ ແລະ ຈຳນວນຮ້ານໃນມື້ນີ້
  const fetchDashboardStats = async () => {
    const today = new Date().toLocaleDateString('en-CA') // ວັນທີປັດຈຸບັນ YYYY-MM-DD
    
    // 1. ດຶງຍອດເກັບເງິນຂອງມື້ນີ້ (ເພີ່ມ payment_method ເຂົ້າມາ)
    const { data: collections } = await supabase
      .from('collections')
      .select('shop_number, total_amount, payment_method')
      .eq('collection_date', today)

    // 2. ດຶງຈຳນວນຮ້ານທີ່ກຳລັງເຊົ່າທັງໝົດ
    const { data: shops } = await supabase
      .from('shops')
      .select('shop_number')
      .eq('status', 'ກຳລັງເຊົ່າ')

    // ຄຳນວນຍອດເງິນລວມ ແລະ ແຍກປະເພດ
    const totalAmt = collections?.reduce((sum, c) => sum + Number(c.total_amount), 0) || 0
    const totalCash = collections?.filter(c => c.payment_method === 'CASH').reduce((sum, c) => sum + Number(c.total_amount), 0) || 0
    const totalTransfer = collections?.filter(c => c.payment_method === 'TRANSFER').reduce((sum, c) => sum + Number(c.total_amount), 0) || 0
    
    // ນັບຈຳນວນຮ້ານທີ່ເກັບແລ້ວ
    const collectedUnique = new Set(collections?.map(c => c.shop_number)).size
    const totalActive = shops?.length || 0
    const pending = totalActive - collectedUnique

    setStats({
      totalCollected: totalAmt,
      totalCash: totalCash,
      totalTransfer: totalTransfer,
      collectedCount: collectedUnique,
      pendingCount: pending > 0 ? pending : 0,
      totalShops: totalActive
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!currentUserRole) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 bg-gray-50">ກຳລັງກວດສອບສິດທິ...</div>
  } 

  const allMenuItems = [
    { title: 'ເກັບເງິນມື້ນີ້ (Quick Collection)', desc: 'ລາຍຊື່ຮ້ານ, ຮັບເງິນສົດ/ໂອນ', icon: Wallet, color: 'bg-emerald-500', href: '/collection', allowedRoles: ['CASHIER', 'MANAGER', 'SUPER_ADMIN'] },
    // ເພີ່ມເມນູ "ບັນທຶກລາຍຈ່າຍ" ເຂົ້າໄປບ່ອນນີ້:
    { title: 'ບັນທຶກລາຍຈ່າຍ (Expenses)', desc: 'ຄ່າໄຟຟ້າສ່ວນກາງ, ຄ່າແປງ, ເງິນເດືອນ', icon: TrendingDown, color: 'bg-orange-500', href: '/expense', allowedRoles: ['MANAGER', 'SUPER_ADMIN', 'ACCOUNTANT'] },
    
    { title: 'ປະຫວັດ & ແກ້ໄຂບິນ', desc: 'ກວດສອບບິນ, ລຶບບິນຜິດ, ເບິ່ງຮ້ານຄ້າງຈ່າຍ', icon: ClipboardList, color: 'bg-teal-500', href: '/history', allowedRoles: ['CASHIER', 'MANAGER', 'SUPER_ADMIN'] },
    { title: 'ຈັດການຮ້ານຄ້າ & ສັນຍາ', desc: 'ຂໍ້ມູນ 150 ຮ້ານ, ໂຊນ, ຜູ້ເຊົ່າ', icon: Store, color: 'bg-blue-500', href: '/shops', allowedRoles: ['MANAGER', 'SUPER_ADMIN'] },
    { title: 'ບັນຊີໜີ້ & Ledger', desc: 'ຍອດຄ້າງ, ປະຫວັດການຈ່າຍ, Statement', icon: Receipt, color: 'bg-rose-500', href: '/debt', allowedRoles: ['MANAGER', 'SUPER_ADMIN', 'ACCOUNTANT'] },
    { title: 'ລາຍງານ & Export', desc: 'ລາຍງານລາຍວັນ, ເດືອນ, ປີ (Excel/PDF)', icon: FileText, color: 'bg-indigo-500', href: '/reports', allowedRoles: ['MANAGER', 'SUPER_ADMIN', 'ACCOUNTANT'] },
  ]

  const menuItems = allMenuItems.filter(item => item.allowedRoles.includes(currentUserRole))

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3.5 flex justify-between items-center shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-gray-900">J-Aeum Market</h1>
          <p className="text-xs text-gray-500">{userEmail ?? 'ກຳລັງໂຫຼດ...'}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          title="ອອກຈາກລະບົບ"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Quick Stats Card (ເຫັນສະເພາະ Admin) */}
        {currentUserRole === 'MANAGER' && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
            <p className="text-blue-100 text-sm font-medium">ຍອດເງິນທີ່ເກັບໄດ້ໃນມື້ນີ້ (ລວມ)</p>
            <h2 className="text-3xl font-extrabold mt-1">{stats.totalCollected.toLocaleString()} LAK</h2>
            
            {/* ເພີ່ມການແຍກເງິນສົດ ແລະ ເງິນໂອນ */}
            <div className="mt-3 flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1.5">
                <span className="text-blue-200">ເງິນສົດ:</span>
                <span className="font-bold text-white">{stats.totalCash.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-blue-200">ເງິນໂອນ:</span>
                <span className="font-bold text-white">{stats.totalTransfer.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-500/30 flex justify-between text-xs text-blue-100">
              <span>ເກັບແລ້ວ: {stats.collectedCount} ຮ້ານ</span>
              <span>ຍັງບໍ່ເກັບ: {stats.pendingCount} ຮ້ານ</span>
              <span>ທັງໝົດ: {stats.totalShops} ຮ້ານ</span>
            </div>
          </div>
        )}

        {/* Menu Grid / List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">ເມນູຈັດການລະບົບ</h3>
          
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div 
                key={index}
                onClick={() => {
                  if (item.href !== '#') {
                    router.push(item.href)
                  } else {
                    alert('ກຳລັງພັດທະນາໃນ Phase ຖັດໄປ!')
                  }
                }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-200 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className={`${item.color} p-3 rounded-xl text-white shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}