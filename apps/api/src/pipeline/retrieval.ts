import { prisma } from "../lib/prisma.js";

export async function findCustomerByContact(contact: string) {
  return prisma.customer.findFirst({
    where: { OR: [{ phone: contact }, { email: contact }] },
    include: { orders: true },
  });
}

export async function customerOrderHistoryForSku(customerId: string, sku: string) {
  return prisma.order.findMany({
    where: { customerId, sku },
    orderBy: { orderedAt: "desc" },
  });
}
