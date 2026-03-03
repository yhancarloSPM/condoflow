using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CondoFlow.Domain.Enums
{
    public class StatusPayments
    {
        public const string Pending = "Pending";
        public const string PaymentSubmitted = "PaymentSubmitted";
        public const string Paid = "Paid";
        public const string Overdue = "Overdue";
    }
}