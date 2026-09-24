// ຟັງຊັນສ້າງຂໍ້ຄວາມໃບຮັບເງິນ (Receipt)
export const sendWhatsAppReceipt = (shopNo: string, amount: number, method: string) => {
  const date = new Date().toLocaleDateString('lo-LA');
  const text = `*ໃບຮັບເງິນ - ຕະຫຼາດ J-Aeum*\n\nຮ້ານ: ${shopNo}\nວັນທີ: ${date}\nຍອດຊຳລະ: *${amount.toLocaleString()} LAK*\nວິທີຈ່າຍ: ${method === 'CASH' ? 'ເງິນສົດ' : 'ເງິນໂອນ'}\n\n_ຂອບໃຈທີ່ໃຊ້ບໍລິການ!_`;
  
  // URL ສຳລັບເປີດແອັບ WhatsApp ພ້ອມຂໍ້ຄວາມ
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// ຟັງຊັນສ້າງຂໍ້ຄວາມແຈ້ງເຕືອນໜີ້ (Debt Reminder)
export const sendWhatsAppDebtReminder = (shopNo: string, debt: number) => {
  const text = `*ແຈ້ງເຕືອນຍອດຄ້າງຊຳລະ*\n(ຕະຫຼາດ J-Aeum)\n\nຮ້ານ: ${shopNo}\nຍອດໜີ້ຄ້າງ: *${debt.toLocaleString()} LAK*\n\nກະລຸນາຊຳລະເພື່ອຫຼີກລ່ຽງການສະສົມຂອງໜີ້. ຂອບໃຈ!`;
  
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}