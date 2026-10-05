'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Save, Map, GripHorizontal, Lock, Unlock, ZoomIn, ZoomOut } from 'lucide-react'

export default function ShopMapPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const [isLocked, setIsLocked] = useState(true)
  const [shops, setShops] = useState<any[]>([])
  const [zoomLevel, setZoomLevel] = useState(1)

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.3))

  const BOX_WIDTH = 100
  const BOX_HEIGHT = 60
  const GRID_X = BOX_WIDTH
  const GRID_Y = BOX_HEIGHT

  const getZoneColor = (shopNumber: string) => {
    const zone = shopNumber.charAt(0).toUpperCase()
    switch (zone) {
      case 'A': return 'bg-red-500 text-white border-red-600'
      case 'B': return 'bg-blue-600 text-white border-blue-700'
      case 'C': return 'bg-yellow-400 text-gray-900 border-yellow-500'
      case 'D': return 'bg-green-500 text-white border-green-600'
      case 'E': return 'bg-purple-600 text-white border-purple-700'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shops')
      .select('shop_number, tenant_name, status, pos_x, pos_y')
      .order('shop_number', { ascending: true })

    if (data) {
      const formattedShops = data.map((shop, index) => ({
        ...shop,
        pos_x: shop.pos_x ?? (index % 15) * GRID_X,
        pos_y: shop.pos_y ?? Math.floor(index / 15) * GRID_Y,
      }))
      setShops(formattedShops)
    }
    setLoading(false)
  }

  const handleDragStart = (e: React.DragEvent, shopNumber: string) => {
    if (isLocked) {
      e.preventDefault()
      return
    }
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    e.dataTransfer.setData('shopNumber', shopNumber)
    e.dataTransfer.setData('offsetX', offsetX.toString())
    e.dataTransfer.setData('offsetY', offsetY.toString())

    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.4'
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (isLocked) return

    const shopNumber = e.dataTransfer.getData('shopNumber')
    const offsetX = parseFloat(e.dataTransfer.getData('offsetX'))
    const offsetY = parseFloat(e.dataTransfer.getData('offsetY'))

    const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const dropX = (e.clientX - containerRect.left) / zoomLevel - offsetX
    const dropY = (e.clientY - containerRect.top) / zoomLevel - offsetY

    let snapX = Math.round(dropX / GRID_X) * GRID_X
    let snapY = Math.round(dropY / GRID_Y) * GRID_Y

    if (snapX < 0) snapX = 0
    if (snapY < 0) snapY = 0

    const draggedShop = shops.find(s => s.shop_number === shopNumber)
    if (!draggedShop) return

    const targetShop = shops.find(s => s.pos_x === snapX && s.pos_y === snapY)
    let updatedShops = [...shops]

    if (targetShop && targetShop.shop_number !== shopNumber) {
      updatedShops = updatedShops.map(shop => {
        if (shop.shop_number === draggedShop.shop_number) {
          return { ...shop, pos_x: snapX, pos_y: snapY } 
        }
        if (shop.shop_number === targetShop.shop_number) {
          return { ...shop, pos_x: draggedShop.pos_x, pos_y: draggedShop.pos_y } 
        }
        return shop
      })
    } else {
      updatedShops = updatedShops.map(shop => 
        shop.shop_number === shopNumber 
          ? { ...shop, pos_x: snapX, pos_y: snapY }
          : shop
      )
    }

    setShops(updatedShops)
    setHasChanges(true)
  }

  const handleSaveLayout = async () => {
    setIsSaving(true)
    const updatePromises = shops.map(shop => supabase.from('shops').update({ pos_x: shop.pos_x, pos_y: shop.pos_y }).eq('shop_number', shop.shop_number))
    await Promise.all(updatePromises)
    setIsSaving(false)
    setHasChanges(false)
    setIsLocked(true)
    alert('ບັນທຶກແຜນຜັງຮ້ານສຳເລັດ!')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-24">
      <header className="bg-white px-4 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center">
          <button onClick={() => router.push('/shops')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl mr-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">ແຜນຜັງຕະຫຼາດ</h1>
              <p className="text-xs text-gray-500">ຈຳນວນ {shops.length} ຮ້ານ</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsLocked(!isLocked)}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${isLocked ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 animate-pulse'}`}
        >
          {isLocked ? <><Lock className="w-4 h-4 mr-2" /> ລ໋ອກແຜນຜັງ</> : <><Unlock className="w-4 h-4 mr-2" /> ກຳລັງແກ້ໄຂ...</>}
        </button>
      </header>

      <main className="p-4 max-w-7xl mx-auto w-full mt-2 flex-1 flex flex-col">
        {loading ? (
          <div className="text-center py-20 font-bold text-gray-500">ກຳລັງໂຫຼດແຜນຜັງ...</div>
        ) : (
          <div className="flex-1 flex flex-col">
            {!isLocked && (
              <div className="mb-3 flex items-center bg-blue-50 text-blue-700 p-3 rounded-xl border border-blue-100 text-sm font-bold">
                <GripHorizontal className="w-5 h-5 mr-2" /> ສາມາດລາກຮ້ານຄ້າໄປວາງຈຸດໃດກໍໄດ້ (ຢ່າລືມກົດບັນທຶກ)
              </div>
            )}

            <div className="absolute right-8 bottom-24 z-30 flex flex-col space-y-2 bg-white p-2 rounded-xl shadow-lg border border-gray-200">
              <button onClick={handleZoomIn} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                <ZoomIn className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold text-center text-gray-500">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={handleZoomOut} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 w-full overflow-auto bg-gray-50 border border-gray-300 rounded-xl shadow-inner p-4 relative">
              <div style={{ width: '3000px', height: '2500px', transformOrigin: 'top left', transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}>
                <div 
                  className="relative w-full h-full"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{
                    backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
                    backgroundSize: `${GRID_X}px ${GRID_Y}px`,
                  }}
                >
                  {shops.map((shop) => (
                    <div
                      key={shop.shop_number}
                      draggable={!isLocked}
                      onDragStart={(e) => handleDragStart(e, shop.shop_number)}
                      onDragEnd={handleDragEnd}
                      className={`absolute flex flex-col items-center justify-center border-b border-r border-black shadow-sm transition-shadow ${
                        isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:shadow-lg hover:z-10'
                      } ${getZoneColor(shop.shop_number)}`} 
                      style={{
                        width: `${BOX_WIDTH}px`,
                        height: `${BOX_HEIGHT}px`,
                        left: `${shop.pos_x}px`,
                        top: `${shop.pos_y}px`,
                        transition: isLocked ? 'none' : 'left 0.2s, top 0.2s'
                      }}
                    >
                      <span className="text-sm font-black tracking-wider">
                        {shop.shop_number}
                      </span>
                      {shop.status === 'ກຳລັງເຊົ່າ' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-300/80"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {(!isLocked || hasChanges) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex justify-center z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <button 
            onClick={handleSaveLayout} 
            disabled={!hasChanges || isSaving}
            className={`w-full max-w-md p-3.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg ${hasChanges ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'ກຳລັງບັນທຶກ...' : hasChanges ? 'ບັນທຶກແຜນຜັງໃໝ່' : 'ຍັງບໍ່ມີການຍ້າຍ'}
          </button>
        </div>
      )}
    </div>
  )
}