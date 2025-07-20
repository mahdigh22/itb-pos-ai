
'use client';

import React from 'react';
import type { Check, PriceList } from '@/lib/types';
import { format } from 'date-fns';

interface BillProps {
  check: Check;
  priceLists: PriceList[];
  taxRate: number;
  restaurantName: string;
}

const Bill = React.forwardRef<HTMLDivElement, BillProps>(
  ({ check, priceLists, taxRate, restaurantName }, ref) => {
    
    const activeItems = check.items.filter(item => item.status !== 'cancelled' && item.status !== 'edited');

    const subtotal = activeItems.reduce((acc, item) => {
        const extrasPrice = item.customizations?.added.reduce((extraAcc, extra) => extraAcc + extra.price, 0) || 0;
        const totalItemPrice = (item.price + extrasPrice) * item.quantity;
        return acc + totalItemPrice;
    }, 0);

    const selectedPriceList = priceLists.find(pl => pl.id === check.priceListId);
    const discountPercentage = selectedPriceList?.discount || 0;
    const discountAmount = subtotal * (discountPercentage / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const tax = discountedSubtotal * (taxRate / 100);
    const total = discountedSubtotal + tax;

    return (
      <div ref={ref} className="p-4 bg-white text-black font-mono text-sm w-[300px]">
        <div className="text-center">
          <h2 className="text-xl font-bold">{restaurantName}</h2>
          <p>{format(new Date(), 'PPpp')}</p>
          <p>-------------------------------</p>
        </div>
        <div className="my-2">
            <p><strong>Check:</strong> {check.name}</p>
            {check.orderType === 'Dine In' && <p><strong>Table:</strong> {check.tableName}</p>}
            {check.orderType === 'Take Away' && <p><strong>Customer:</strong> {check.customerName}</p>}
            <p><strong>Server:</strong> {check.employeeName}</p>
        </div>
        <p>-------------------------------</p>
        <div>
          {activeItems.map(item => (
            <div key={item.lineItemId} className="my-1">
              <div>{item.quantity} x {item.name}</div>
              <div className="flex justify-between">
                <span>  @ ${item.price.toFixed(2)}</span>
                <span>${(item.quantity * item.price).toFixed(2)}</span>
              </div>
              {item.customizations.added.map(extra => (
                 <div key={extra.id} className="flex justify-between pl-4 text-xs">
                    <span>+ {extra.name}</span>
                    <span>+${extra.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p>-------------------------------</p>
        <div className="space-y-1">
            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
                 <div className="flex justify-between">
                    <span>Discount ({discountPercentage}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                </div>
            )}
             <div className="flex justify-between">
                <span>Tax ({taxRate.toFixed(1)}%):</span>
                <span>${tax.toFixed(2)}</span>
            </div>
             <p>-------------------------------</p>
             <div className="flex justify-between font-bold text-lg">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
            </div>
        </div>
        <p>-------------------------------</p>
        <div className="text-center mt-4">
            <p>Thank you for your visit!</p>
        </div>
      </div>
    );
  }
);
Bill.displayName = 'Bill';

export default Bill;
