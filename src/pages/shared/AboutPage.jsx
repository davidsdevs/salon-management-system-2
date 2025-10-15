import { Award, Users, Clock, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import PromotionPopup from "./PromotionPopup"

export default function AboutPage() {
  const [isExpanded, setIsExpanded] = useState(false)
  const stats = [
    { number: "200+", label: "Branches Nationwide" },
    { number: "1M+", label: "Happy Clients" },
    { number: "35+", label: "Years of Experience" },
    { number: "3", label: "Countries" },
  ]

  const executiveTeam = [
    {
      name: "Marivic Aguibiador",
      role: "Executive Vice President for Finance and Operations",
      image: "/images/team/executives/marivicaguibiador.jpg",
    },
    {
      name: "Maria Luisa Flores",
      role: "Vice President for Human Resources",
      image: "/images/team/executives/marialuisa.jpg",
    },
  ]

  const managementTeam = [
    {
      name: "Jeng Sy",
      role: "Retail Department Manager",
      image: "/images/team/management/jengsy.jpg",
    },
    {
      name: "Lorna Sandoval",
      role: "Academy Training Director",
      image: "/images/team/management/lornasandoval.jpg",
    },
    {
      name: "Hanna Riñon de Grano",
      role: "Purchasing Department Manager",
      image: "/images/team/management/hannarinon.jpg",
    },
  ]

  const benefits = [
    {
      icon: <Award className="w-8 h-8" />,
      title: "Expert stylists",
      description: "Experienced professionals trained in the latest techniques and trends.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Premium products",
      description: "High-quality products and tools for the best results.",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Customized solutions",
      description: "Tailored treatments that fit your unique style and preferences.",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "International standards",
      description: "World-class service with Filipino hospitality and warmth.",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Promotion Popup */}
      <PromotionPopup />
      
      {/* Hero Section */}
      <section
        className="relative h-[800px] flex items-center justify-center text-center text-white mt-[122px]"
        style={{
          backgroundImage: `linear-gradient(rgba(22, 11, 83, 0.7), rgba(22, 11, 83, 0.7)), url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/441497757_1392380064751655_248591870024847667_n%201-EoXi9uyyfemn6aMBujpw67luRG1Z7D.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-4xl px-6">
          <h1 className="font-bold mb-6 text-balance" style={{ fontSize: '50px' }}>Our Story</h1>
          <p className="text-xl leading-relaxed text-pretty">
            From humble beginnings to becoming the Philippines' most trusted salon chain. Managed by industry experts
            with over 35 years of combined experience, we've built a legacy of excellence that spans generations and
            continues to set the standard for beauty and style.
          </p>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold text-[#160B53] mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our Founder Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-bold text-center text-[#160B53] mb-4" style={{ fontSize: '50px' }}>Meet Our Founder</h2>
          <p className="text-center text-gray-600 mb-12">
            The visionary behind the integrated male grooming salon brand
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-3xl font-bold text-[#160B53] mb-4">David Charlton</h3>
              <p className="text-lg text-gray-600 mb-4">Founder</p>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-justify">
                  David Charlton is a visionary entrepreneur with over three decades of experience in the beauty and
                  wellness industry. His journey began in the early 1990s when he recognized the untapped potential in
                  the Filipino market for premium salon services that combine international standards with local
                  sensibilities.
                </p>

                <p className="text-justify">
                  Under his leadership, David's Salon has grown from a single location to over 200 branches across the
                  Philippines, establishing itself as the country's most trusted salon chain. His commitment to
                  excellence and innovation has earned him recognition as one of the industry's most influential
                  leaders.
                </p>

                <p className="text-justify">
                  David's philosophy centers on empowering both clients and staff through continuous education, premium
                  products, and personalized service. His vision extends beyond business success to creating meaningful
                  impact in communities across the nation.
                </p>
              </div>

              <div className="mt-8 p-4 bg-white rounded-lg border-l-4 border-[#160B53]">
                <p className="text-[#160B53] font-semibold mb-2">Industry Pioneer</p>
                <p className="text-sm text-gray-600">
                  "Our success lies in understanding that beauty is personal, and every client deserves to feel
                  confident and beautiful."
                </p>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DC%201-lnGIWn6aY2YuvXcg35yYsKsosL1eWp.png"
                alt="David Charlton, Founder and CEO"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Company Story Section */}
      <section className="py-16 px-6 bg-[#160B53] text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 whitespace-nowrap">
            Whoever you are, whatever you do, we bring out the best in you
          </h2>

          <div className="space-y-6 text-lg leading-relaxed">
            <p className="text-justify">
              David's Salon offers world-class hairdressing, fueled by Filipino passion. With the vision of bringing
              true European hairdressing to the Philippines, CEO David Charlton and the David's Salon's brand has made a
              name for itself, offering a wide range of hair and beauty services to a wide range of customers. It is a
              name that has been earned and followed by many Filipinos since its first salon opened in 1988. It is now
              the biggest chain of salons in the Philippines with over 200 branches all over the country.
            </p>

            <p className="text-justify">
              "We take pride in providing the highest quality of service at prices everyone can afford," says Charlton.
              David's Salon's roster of services includes Hair Styling, Hair Color, Hot Oil and Scalp Treatments,
              Perming, Relaxing, Rebonding, Make Up, Waxing/Threading, Nail Care, and Hand and Foot Spa.
            </p>

            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-6">
                <p className="text-justify">
                  A trusted salon brand such as David's Salon works with different trusted suppliers for hair care, hair
                  color, and other kinds of technologies used for hair styling. Among these suppliers are Loreal, Wella
                  Professional Service, Alfaparf Infiniti, and Schwarzkopf & Henkel.
                </p>

                <p className="text-justify">
                  Total customers satisfaction is the goal of David's Salon. The David's Salon Experience is one where
                  customers are given relaxing ambiance, professional consultations from creative stylists, and personal
                  assistance by store managers and store assistants.
                </p>

                <p className="text-justify">
                  Clients are pampered as they are given quality service with professional care coming from a well-trained
                  team. David's Salon has a solid core business management team equipped themselves with the latest and most
                  innovative European hairdressing technology, which they generously and systematically pass on to every
                  David's Salon stylist.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 font-medium"
            >
              {isExpanded ? (
                <>
                  <span>Read Less</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Read More</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Laura Charlton Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DC%201%20%281%29-naiRFHoiiPP970mA8FxdHoiQjnpvAz.png"
                alt="Laura Charlton, CEO and President"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>

            <div>
              <h3 className="text-3xl font-bold text-[#160B53] mb-4">Laura Charlton</h3>
              <p className="text-lg text-gray-600 mb-4">CEO and President</p>

              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-justify">
                  Laura Charlton brings over two decades of operational excellence to David's Salon. As CEO and President,
                  she oversees the day-to-day operations of all branches, ensuring consistent quality and
                  service standards across the entire network.
                </p>

                <p className="text-justify">
                  Her expertise in staff training and development has been instrumental in building David's Salon's
                  reputation for exceptional service. Laura's commitment to continuous improvement and innovation has
                  helped establish the company as an industry leader in the Philippines.
                </p>

                <p className="text-justify">
                  Under her guidance, David's Salon has implemented cutting-edge training programs and quality assurance
                  systems that ensure every client receives the premium experience they deserve, regardless of which
                  branch they visit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-bold text-center text-[#160B53] mb-12" style={{ fontSize: '50px' }}>Our Team</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-3xl mx-auto">
            {executiveTeam.map((member, index) => (
              <div 
                key={index} 
                className="relative overflow-hidden bg-white rounded-lg aspect-[3/4]"
                style={{ boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.25)' }}
              >
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                  <p className="text-gray-200 text-sm">{member.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {managementTeam.map((member, index) => (
              <div 
                key={index} 
                className="relative overflow-hidden bg-white rounded-lg aspect-[3/4]"
                style={{ boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.25)' }}
              >
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                  <p className="text-gray-200 text-sm">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose David's Salon Section */}
      <section className="py-16 px-6 bg-[#160B53] text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-bold text-center mb-4" style={{ fontSize: '50px' }}>Why Choose David's Salon</h2>
          <p className="text-center text-xl mb-12 text-pretty">
            Where every client receives exceptional service and achieves their desired look with personalized care for
            every client.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <div className="text-[#160B53]">{benefit.icon}</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-gray-200 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
