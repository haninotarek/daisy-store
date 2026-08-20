// Small helpers kept separate so order.service stays focused.
export async function generateOrderNumber() {
  const { default: prisma } = await import('../config/db.js');
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { orderNumber: { startsWith: `DAISY-${year}-` } },
  });
  return `DAISY-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function clearCartTx(tx, userId) {
  const cart = await tx.cart.findUnique({ where: { userId } });
  if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
}
