#!/bin/bash

# تفعيل الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🚀 تشغيل سريع - Supabase Setup                         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 3 خطوات حاسمة في Supabase:${NC}"
echo ""
echo -e "${GREEN}┌─────────────────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│ 1️⃣  إنشاء الجداول (supabase-schema.sql)              │${NC}"
echo -e "${GREEN}└─────────────────────────────────────────────────────────┘${NC}"
echo -e "   👉 ${BLUE}https://supabase.com/dashboard/project/ekezjmhpdzydiczspfsm/sql/new${NC}"
echo -e "   📄 انسخ محتوى: supabase-schema.sql"
echo ""
echo -e "${RED}┌─────────────────────────────────────────────────────────┐${NC}"
echo -e "${RED}│ 2️⃣  تعطيل RLS (supabase-disable-rls.sql) ⚠️ حاسم!   │${NC}"
echo -e "${RED}└─────────────────────────────────────────────────────────┘${NC}"
echo -e "   👉 ${BLUE}نفس الرابط أعلاه${NC}"
echo -e "   📄 انسخ محتوى: supabase-disable-rls.sql"
echo -e "   ${RED}⚠️  بدون هذه الخطوة لن يعمل التطبيق!${NC}"
echo ""
echo -e "${PURPLE}┌─────────────────────────────────────────────────────────┐${NC}"
echo -e "${PURPLE}│ 3️⃣  إدخال البيانات (supabase-import-data.sql)        │${NC}"
echo -e "${PURPLE}└─────────────────────────────────────────────────────────┘${NC}"
echo -e "   👉 ${BLUE}نفس الرابط أعلاه${NC}"
echo -e "   📄 انسخ محتوى: supabase-import-data.sql"
echo -e "   ✅ سيضيف 26 سجل (تصنيفات، وحدات، إلخ)"
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}🧪 اختبار الاتصال:${NC}"
echo -e "   ${BLUE}http://localhost:8888/test-supabase-connection.html${NC}"
echo ""
echo -e "${YELLOW}📖 الدليل الكامل:${NC}"
echo -e "   ${BLUE}http://localhost:8888/SETUP_GUIDE.html${NC}"
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
echo ""
read -p "اضغط Enter للمتابعة..."

echo ""
echo -e "${GREEN}⏳ تشغيل خادم الاختبار على http://localhost:8888${NC}"
echo -e "${YELLOW}📂 افتح المتصفح على الروابط أعلاه${NC}"
echo ""
echo -e "${RED}[اضغط Ctrl+C لإيقاف الخادم]${NC}"
echo ""

python3 -m http.server 8888
