import React from 'react';
import Footer from './Footer';
import '../AdminStyles/Home.css';
import edunextLogo from '../assets/EDU.svg';
import promoProgressDashboard from '../assets/promo/promo-progress-dashboard.png';
import promoAiTutor from '../assets/promo/promo-ai-tutor.png';
import promoAiTutorFeatured from '../assets/promo/promo-ai-tutor-featured.png';
import promoStudyRecommendations from '../assets/promo/promo-study-recommendations.png';
import promoSmartSchedules from '../assets/promo/promo-smart-schedules.png';
import promoPlatformOverview from '../assets/promo/promo-platform-overview.png';
import { useState, useEffect } from 'react';
import { 
  BarChart3, ThumbsUp, Calendar, Bot, HelpCircle, 
  TrendingUp, Sigma, Zap, Globe, X, CheckCircle2, BookOpen, ArrowLeft, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

// import '../App.css';
import { useNavigate } from 'react-router-dom';

const faqData = [
  {
    question: 'ما هي منصة EduNext؟',
    answer: 'EduNext هي منصة تعليمية ذكية مصممة خصيصاً لطلاب التوجيهي، تقدم خططاً دراسية مخصصة، امتحانات تجريبية، وتحليلات أداء متقدمة باستخدام الذكاء الاصطناعي.'
  },
  {
    question: 'هل المنصة مجانية؟',
    answer: 'نعم، يمكنك البدء مجاناً مع إمكانية الوصول إلى مجموعة واسعة من المحتوى التعليمي. كما تتوفر خطط مدفوعة للحصول على ميزات إضافية متقدمة.'
  },
  {
    question: 'كيف يعمل الذكاء الاصطناعي في المنصة؟',
    answer: 'يقوم الذكاء الاصطناعي بتحليل أدائك وتحديد نقاط القوة والضعف لديك، ثم يقترح خططاً دراسية مخصصة وتمارين موجهة لتحسين مستواك بشكل فعال.'
  },
  {
    question: 'هل يمكنني استخدام المنصة على الهاتف؟',
    answer: 'بالتأكيد! المنصة مصممة لتعمل بسلاسة على جميع الأجهزة بما في ذلك الهواتف الذكية والأجهزة اللوحية وأجهزة الكمبيوتر.'
  }
];

const promoSlides = [
  {
    title: 'انضم الآن لحملة النجاح في التوجيهي',
    subtitle: 'خطط دراسية مخصصة، مراجعات ذكية، ودعم فوري بالذكاء الاصطناعي.',
    image: promoProgressDashboard,
    badge: 'عرض محدود',
    details: 'سجل اليوم لتحصل على إشعارات فورية بالخطة الأنسب لك وقسم دراسة جاهز خلال ثوانٍ.'
  },
  {
    title: 'لوحة تحكم أكاديمية متكاملة',
    subtitle: 'تابع جميع المواد، النتائج، والتقدّم في مكان واحد.',
    image: promoAiTutor,
    badge: 'مميز',
    details: 'رؤية أدائك التطبيقي وفهم نقاط القوة والضعف بسرعة.'
  },
  {
    title: 'جداول دراسية ذكية تتكيف مع وقتك',
    subtitle: 'خطة منظمة تساعدك على الإنجاز بسرعة أكبر.',
    image: promoAiTutorFeatured,
    badge: 'جديد',
    details: 'خطط تلقائية تتغير حسب جدولك الدراسي ومستواك اليومي.'
  },
  {
    title: 'روبوت ذكي لكل مادة يجيب فوري',
    subtitle: 'اسأل المادة وتلقّى شرحاً واضحاً ومحفزاً.',
    image: promoStudyRecommendations,
    badge: 'تجربة مجانية',
    details: 'مساعد تفاعلي يعمل 24/7 لدعم استذكارك ومراجعاتك.'
  },
  {
    title: 'تتبّع التقدّم والنتائج بسهولة',
    subtitle: 'تعرف على معدل الطالب ونقاط الأداء الرئيسية.',
    image: promoSmartSchedules,
    badge: 'جديد',
    details: 'احصل على لمحة سريعة عن أداءك وأهدافك المقرّبة في كل لحظة.'
  },
  {
    title: 'EduNext',
    subtitle: 'Personalized AI advice, unified academic dashboard, and test performance analysis.',
    image: promoPlatformOverview,
    badge: 'EduNext',
    details: 'All learning tools in one visual overview.'
  }
];

////////////////////////////////////////////
const subjects = [
  {
    id: "arabic",
    name: "اللغة العربية",
    description: "غوص عميق في الأدب، القواعد، والتعبير البليغ.",
    longDescription:
      "مادة أساسية في التوجيهي الفلسطيني تهدف إلى تنمية مهارات الطالب في القراءة والتحليل والتعبير. تشمل دراسة قواعد النحو والصرف، والبلاغة، والنصوص الأدبية من مختلف العصور، بالإضافة إلى تطوير مهارات الكتابة والتعبير الإبداعي والوظيفي.",
    icon: BookOpen,
    iconBg: "#e6f5ec",
    iconColor: "#2f8a55",
    level: "كل الفروع",
    lessonsNumber: 6,
  },
  {
    id: "english",
    name: "اللغة الإنجليزية",
    description: "إتقان القواعد، الأدب، والاستيعاب القرائي.",
    longDescription:
    "مادة تهدف إلى تعزيز مهارات الطالب في اللغة الإنجليزية من قراءة وكتابة واستماع وتحدث. تشمل دراسة القواعد الأساسية والمتقدمة، وفهم النصوص، وتحليل القطع الأدبية، وتوسيع المفردات بما يتناسب مع متطلبات الامتحان الوزاري.",
    icon: Globe,
    iconBg: "#fdeede",
    iconColor: "#d97a3a",
    level: "كل الفروع",
    lessonsNumber: 12,
  },
  {
    id: "physics",
    name: "الفيزياء",
    description: "الميكانيكا، الكهرومغناطيسية، والفيزياء الحديثة مشروحة ببساطة.",
    longDescription:
      "مادة علمية تدرس القوانين التي تحكم الظواهر الطبيعية مثل الحركة، القوة، الطاقة، الكهرباء، والمغناطيسية. تساعد الطالب على فهم العالم من حوله بطريقة علمية وتطبيقية، مع التركيز على حل المسائل والتجارب النظرية.",
    icon: Zap,
    iconBg: "#ece6fb",
    iconColor: "#6b46d1",
    level: "الفرع العلمي",
    lessonsNumber: 18,
  },
  {
    id: "math",
    name: "الرياضيات",
    description: "التفاضل والتكامل، الجبر، والهندسة المصممة للفرع العلمي.",
    longDescription:
      "مادة تعتمد على التفكير المنطقي وحل المشكلات، وتشمل موضوعات مثل الجبر، التفاضل والتكامل، الهندسة، والإحصاء والاحتمالات. تهدف إلى تنمية القدرة على التحليل الرياضي وتطبيق القوانين في مسائل حياتية وأكاديمية.",
    icon: Sigma,
    iconBg: "#e7eefb",
    iconColor: "#2f5fcc",
    level: "الفرع العلمي",
    lessonsNumber: 20,
  },
];
////////////////////////////////////////////
export default function Home() {
    const navigate = useNavigate();
    const handleLogin = () => {  navigate('/login');   };
    const handleSignup = () => { navigate('/register'); };
    const [openFaq, setOpenFaq] = useState(null);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [openId, setOpenId] = useState(null);
    const [promoIndex, setPromoIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const active = subjects.find((s) => s.id === openId);

    const close = () => setOpenId(null);

    useEffect(() => {
      const interval = setInterval(() => {
        setPromoIndex((prevIndex) => (prevIndex + 1) % promoSlides.length);
      }, 4200);
      return () => clearInterval(interval);
    }, []);

    const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

    
  return (
    <div className="appContainer">
             {/* Navbar */}
        <nav className="landing-navbar">
          <div className="navbar-container">
          <div className="navbar-logo" onClick={() => window.location.href = '/'}>
            <img src={edunextLogo} alt="EduNext Logo" width={50} height={50}/>
            <span>EduNext</span>
          </div>

          <div className={`navbar-links ${mobileMenu ? 'active' : ''}`}>
            <a href="#hero" onClick={() => setMobileMenu(false)}>الرئيسية</a>
            <a href="#subjects" onClick={() => setMobileMenu(false)}>المواد الدراسية</a>
            <a href="#faq" onClick={() => setMobileMenu(false)}>الأسئلة الشائعة</a>
          </div>

          <div className="navbar-actions">
            <button className="btn-outline-nav" onClick={handleLogin}>تسجيل دخول</button>
            <button className="btn-primary-nav" onClick={handleSignup}>ابدأ مجاناً</button>
          </div>

          <button className="mobile-menu-btn" onClick={() => setMobileMenu(!mobileMenu)}>
            <div className={`hamburger ${mobileMenu ? 'open' : ''}`}>
              <span></span><span></span><span></span>
            </div>
          </button>
        </div>
      </nav>
      <div className='homeContent'>
        {/* Hero Promo */}
        <section className="promo-banner" id="hero">
          <div className="promo-banner-card">
            <div className="promo-ad-badge">{promoSlides[promoIndex].badge}</div>
            <h2>سجل الآن في EduNext وابدأ رحلة التفوق الدراسي</h2>
            <p>كل ما يحتاجه طالب التوجيهي في مكان واحد: مواد منظمة، خطط دراسة ذكية، مساعد لكل مادة، وتحليل واضح للتقدم والاختبارات.</p>
            <div className="promo-banner-actions">
              <button className="btn btn-primary-hero btn-lg" onClick={handleSignup}>سجل الآن</button>
              <button className="btn btn-secondary-hero btn-lg" onClick={handleLogin}>تسجيل دخول</button>
            </div>
            <div className="promo-banner-info">
              <div><CheckCircle2 size={16} /> توصيات وخطط بناءً على مستواك</div>
              <div><CheckCircle2 size={16} /> روبوت شرح ومراجعة لكل مادة</div>
              <div><CheckCircle2 size={16} /> لوحة أداء واختبارات بقراءة سهلة</div>
            </div>
          </div>
          <div className="promo-banner-visual">
            <div className="promo-banner-image-box">
              <img src={promoSlides[promoIndex].image} alt={promoSlides[promoIndex].title} loading="lazy" />
            </div>
            <div className="promo-slide-dots" aria-label="صور الإعلانات">
              {promoSlides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  className={`promo-slide-dot ${index === promoIndex ? 'active' : ''}`}
                  onClick={() => setPromoIndex(index)}
                  aria-label={`عرض ${slide.title}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* feature Section */}
        <section className="featuree">
          <div className="containerr">
            <div className="section-header">
              <div className="section-kicker"><Sparkles size={16} /> أدوات EduNext</div>
              <h2>منصة واحدة تجمع التعلم، التخطيط، والقياس</h2>
              <p>بدون تنقل مشتت: الطالب يبدأ من المواد، يراجع مع المساعد الذكي، ينظم وقته، ثم يرى تقدمه بوضوح.</p>
            </div>
            
            <div className="featuree-grid">
              <div className="featuree-card">
                <BarChart3 className="featuree-icon" />
                <h3>تحليل الأداء بالذكاء الاصطناعي</h3>
                <p>رؤى عميقة في أنماط تعلمك وتحديد فجوات المعرفة.</p>
              </div>
              <div className="featuree-card">
                <ThumbsUp className="featuree-icon" />
                <h3>توصيات دراسية مخصصة</h3>
                <p>محتوى ودروس فيديو مصممة بناءً على نقاط ضعفك الأكاديمية المحددة.</p>
              </div>
              <div className="featuree-card">
                <Calendar className="featuree-icon" />
                <h3>خطط دراسية ذكية</h3>
                <p>جداول تلقائية وديناميكية تتكيف مع وتيرتك اليومية وتقدمك.</p>
              </div>
              <div className="featuree-card">
                <Bot className="featuree-icon" />
                <h3>روبوت دردشة تفاعلي لكل مادة</h3>
                <p>إجابات فورية ومعرفية بالمنهاج لكل مادة، متوفرة على مدار الساعة.</p>
              </div>
              <div className="featuree-card">
                <HelpCircle className="featuree-icon" />
                <h3>امتحانات تجريبية واختبارات</h3>
                <p>محاكاة واقعية للامتحانات وفقاً لمعايير وزارة التربية والتعليم الفلسطينية.</p>
              </div>
              <div className="featuree-card">
                <TrendingUp className="featuree-icon" />
                <h3>تتبع تقدم الطالب</h3>
                <p>لوحة تحكم مرئية تتبع نموك الأكاديمي طوال العام الدراسي.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Subjects Section */}
        <section className="subjects" id="subjects">
          
          <div className="container">
            <div className="subjects-header">
              <div>
                <h2>استكشف موادك الدراسية</h2>
                <p>اختر مادة لتبدأ تجربة التعلم المخصصة الخاصة بك.</p>
              </div>
              <a href="#" className="view-all">
                عرض جميع المواد <ArrowLeft size={18} />
              </a>
            </div>
            
            <div className="subjects-grid">
              <div className="subject-card math">
                <div className="subject-banner">
                  <Sigma size={48} />
                </div>
                <div className="subject-content">
                  <h3>الرياضيات</h3>
                  <p>التفاضل والتكامل، الجبر، والهندسة المصممة للفرع العلمي.</p>
                  <button className="btn-outline"
                  onClick={() => setOpenId("math")}
                  >استكشف المادة</button>
                </div>
              </div>
              
              <div className="subject-card physics">
                <div className="subject-banner">
                  <Zap size={48} />
                </div>
                <div className="subject-content">
                  <h3>الفيزياء</h3>
                  <p>الميكانيكا، الكهرومغناطيسية، والفيزياء الحديثة مشروحة ببساطة.</p>
                  <button className="btn-outline"
                  onClick={() => setOpenId("physics")}>استكشف المادة</button>
                </div>
              </div>
              
              <div className="subject-card english">
                <div className="subject-banner">
                  <Globe size={48} />
                </div>
                <div className="subject-content">
                  <h3>اللغة الإنجليزية</h3>
                  <p>إتقان القواعد، الأدب، والاستيعاب القرائي.</p>
                  <button className="btn-outline"
                  onClick={() => setOpenId("english")}>استكشف المادة</button>
                </div>
              </div>
              
              <div className="subject-card arabic">
                <div className="subject-banner">
                  <BookOpen size={48} />
                </div>
                <div className="subject-content">
                  <h3>اللغة العربية</h3>
                  <p>غوص عميق في الأدب، القواعد، والتعبير البليغ.</p>
                  <button className="btn-outline"
                  onClick={() => setOpenId("arabic")}>استكشف المادة</button>
                </div>
              </div>
            </div>
          </div> 
          {active && (
        <div className="se-modal-overlay" onClick={close} role="presentation">
          <div
            className="se-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            dir="rtl"
          >
            <button type="button" className="se-modal-close" onClick={close} aria-label="إغلاق">
              <X size={18} />
            </button>

            <div className="se-modal-head">
              <div className="se-modal-icon" style={{ backgroundColor: active.iconBg }}>
                <active.icon size={26} style={{ color: active.iconColor }} />
              </div>
              <h3>{active.name}</h3>
            </div>

            <p className="se-modal-desc">{active.longDescription}</p>

            <div className="se-badges">
              <span className="se-badge">{active.level}</span> 
              <span className="se-badge">{active.lessonsNumber} دروس</span> 
            </div>


            <div className="se-modal-actions">
              <button type="button" className="se-btn se-btn-ghost" onClick={close}>
                إغلاق
              </button>
              <button type="button" className="se-btn se-btn-primary" onClick={() => {
                close();
                handleLogin();
              }}>
                ابدأ التعلم
              </button>
            </div>
          </div>
        </div>
      )}
        </section>

       {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="section-container">
          <h2 className="section-title">الأسئلة الشائعة</h2>
          <p className="section-subtitle">كل ما تحتاج معرفته حول المنصة.</p>
          <div className="faq-list">
            {faqData.map((item, i) => (
                <div className={`faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
                <button className="faq-question" onClick={() => toggleFaq(i)}>
                  <span>{item.question}</span>
                  {openFaq === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openFaq === i && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta">
          <div className="container">
            <div className="cta-box">
              <h2 className="cta-title">جاهز للتفوق في التوجيهي؟</h2>
              <p className="cta-text">
                انضم إلى آلاف الطلاب الفلسطينيين الذين يستخدمون الذكاء الاصطناعي لتأمين مستقبلهم. سجل اليوم وابدأ رحلتك.
              </p>
              <div className="cta-actions">
                <button className="btn cta-primary-action" onClick={handleSignup}>أنشئ حساباً مجانياً</button>
                <button className="btn cta-secondary-action" onClick={handleLogin}>سجل دخولك الآن</button>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
};

