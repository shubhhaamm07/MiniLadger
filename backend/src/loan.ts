export interface Loan {
  id: number;
  userId: number;
  friendName: string;
  amountPaise: number;
  dueDate: string;
  repaidAt: string | null;
}