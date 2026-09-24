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
  Calculator,
  Building2
} from 'lucide-react'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? null)
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // ສົມມຸດວ່າ User ປັດຈຸບັນເປັນ 'CASHIER' (ໃນອະນາຄົດຈະດຶງຈາກຕາຕະລາງ profiles)
  const currentUserRole = 'CASHIER'; 

  const allMenuItems = [
    { title: 'ເກັບເງິນມື້ນີ້ (Quick Collection)', desc: 'ລາຍຊື່ຮ້ານ, ຮັບເງິນສົດ/ໂອນ', icon: Wallet, color: 'bg-emerald-500', href: '/collection', allowedRoles: ['CASHIER', 'MANAGER', 'SUPER_ADMIN'] },
    { title: 'ມອບ-ຮັບເງິນ (Cash Handover)', desc: 'ປິດຮອບເກັບເງິນ, ສົ່ງມອບເງິນສົດ', icon: Building2, color: 'bg-purple-500', href: '/handover', allowedRoles: ['CASHIER', 'MANAGER', 'SUPER_ADMIN'] },
    { title: 'ບັນທຶກຄ່າໄຟ', desc: 'ຈົດຄ່າໄຟ ແລະ ອຸປະກອນແຕ່ລະຮ້ານ', icon: Calculator, color: 'bg-amber-500', href: '/electricity', allowedRoles: ['MANAGER', 'SUPER_ADMIN', 'ACCOUNTANT'] },
    { title: 'ຈັດການຮ້ານຄ້າ & ສັນຍາ', desc: 'ຂໍ້ມູນ 150 ຮ້ານ, ໂຊນ, ຜູ້ເຊົ່າ', icon: Store, color: 'bg-blue-500', href: '/shops', allowedRoles: ['MANAGER', 'SUPER_ADMIN'] },
    { title: 'ບັນຊີໜີ້ & Ledger', desc: 'ຍອດຄ້າງ, ປະຫວັດການຈ່າຍ, Statement', icon: Receipt, color: 'bg-rose-500', href: '/debt', allowedRoles: ['MANAGER', 'SUPER_ADMIN', 'ACCOUNTANT'] },
    { title: 'ລາຍງານ & Export', desc: 'ລາຍງານລາຍວັນ, ເດືອນ, ປີ (Excel/PDF)', icon: FileText, color: 'bg-indigo-500', href: '/reports', allowedRoles: ['MANAGER', 'SUPER_ADMIN', 'ACCOUNTANT'] },
  ]

  // ກັ່ນຕອງເອົາສະເພາະເມນູທີ່ Role ຂອງ User ມີສິດເຫັນ
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
        {/* Quick Stats Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-blue-100 text-sm font-medium">ຍອດຄວນເກັບມື້ນີ້ (ລວມ)</p>
          <h2 className="text-3xl font-extrabold mt-1">0 LAK</h2>
          <div className="mt-4 pt-4 border-t border-blue-500/30 flex justify-between text-xs text-blue-100">
            <span>ເກັບແລ້ວ: 0 ຮ້ານ</span>
            <span>ຍັງບໍ່ເກັບ: 150 ຮ້ານ</span>
          </div>
        </div>

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