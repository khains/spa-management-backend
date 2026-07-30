// Tinh nhan phan loai cho 1 khach hang dua tren cac goi lieu trinh cua ho.
// Tra ve mang cac nhan, vi du: ["moi", "dang_dung_lieu_trinh", "sap_het_buoi"]
function classifyCustomer(customer, customerPackages, thresholds) {
  const { lowSessionThreshold = 2, expiringSoonDays = 7 } = thresholds || {};
  const tags = new Set();
  const now = new Date();

  if (!customerPackages || customerPackages.length === 0) {
    tags.add("moi"); // Chua tung mua goi nao
  } else {
    const hasActive = customerPackages.some((p) => p.status === "active");
    if (hasActive) tags.add("dang_dung_lieu_trinh");

    for (const p of customerPackages) {
      if (p.status !== "active") continue;
      const remaining = p.sessionsTotal - p.sessionsUsed;
      if (remaining <= lowSessionThreshold && remaining > 0) {
        tags.add("sap_het_buoi");
      }
      if (remaining <= 0) {
        tags.add("da_het_buoi");
      }
      const daysLeft = Math.ceil((new Date(p.endDate) - now) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= expiringSoonDays) {
        tags.add("sap_het_han");
      }
      if (daysLeft < 0) {
        tags.add("da_het_han");
      }
    }

    // Khach chua tung check-in buoi nao va goi con moi -> van tinh la moi mua
    const totalUsed = customerPackages.reduce((s, p) => s + p.sessionsUsed, 0);
    if (totalUsed === 0 && customerPackages.length > 0) {
      tags.add("moi_mua_goi");
    }
  }

  if (customer.manualTag === "vip") {
    tags.add("vip");
  }

  return Array.from(tags);
}

module.exports = { classifyCustomer };
