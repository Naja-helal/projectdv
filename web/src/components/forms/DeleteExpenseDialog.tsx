import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { expensesApi } from '@/lib/supabaseApi'
import type { Expense } from '@/types'

interface DeleteExpenseDialogProps {
  expense: Expense | null
  open: boolean
  onClose: () => void
}

export default function DeleteExpenseDialog({ expense, open, onClose }: DeleteExpenseDialogProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (expenseId: number) => expensesApi.delete(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      onClose()
    },
    onError: (error) => {
      console.error('خطأ في حذف المصروف:', error)
    }
  })

  const handleDelete = () => {
    if (expense) {
      deleteMutation.mutate(expense.id)
    }
  }

  if (!expense) return null

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="w-full max-w-lg max-h-[95vh] overflow-y-auto m-0 sm:m-6 rounded-none sm:rounded-lg">
        <AlertDialogHeader className="text-center space-y-4 pb-6">
          <AlertDialogTitle className="text-2xl font-bold text-red-600">🗑️ حذف المصروف</AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-gray-700 leading-relaxed">
            هل أنت متأكد من حذف هذا المصروف؟
            <br />
            <div className="bg-gray-100 p-4 rounded-lg mt-3 text-right">
              <strong className="text-green-600">💰 المبلغ:</strong> {expense.amount} ريال
              <br />
              <strong className="text-blue-600">📂 الفئة:</strong> {expense.category_name}
            </div>
            <span className="text-red-500 font-semibold">⚠️ هذا الإجراء لا يمكن التراجع عنه.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-3 pt-6 border-t-2">
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full py-4 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-700 min-h-[56px]"
          >
            {deleteMutation.isPending ? '⏳ جاري الحذف...' : '🗑️ تأكيد الحذف'}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full py-4 text-lg font-bold rounded-xl border-2 min-h-[56px]">
            ❌ إلغاء
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
