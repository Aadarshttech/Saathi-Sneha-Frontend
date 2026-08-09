import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, Shield, Users, Star, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Saathi Sneha Care Home Health',
  description: 'Saathi Sneha Care was founded by Nepali healthcare professionals to solve the problem of ageing parents left behind as their children build lives abroad.',
}

const VALUES = [
  { icon: Heart,  title: 'Dignity at Home',   desc: 'We believe every elder deserves to age in the comfort and familiarity of their own home, with family connections maintained no matter where they live.' },
  { icon: Shield, title: 'Clinical Safety',   desc: 'Every care protocol is designed to clinical standards. Our staff are trained nurses and doctors — not just caregivers. Safety is never compromised for convenience.' },
  { icon: Users,  title: 'Family Inclusion',  desc: 'We treat the whole family as the care team. Sons in Boston, daughters in London — everyone gets the same real-time visibility into their parents\' health.' },
  { icon: Star,   title: 'Transparency',      desc: 'No hidden fees, no ambiguous reports. Every visit note, lab result, and care update is in plain language, in your dashboard, within hours.' },
]

const TEAM = [
  { name: 'Dr. Nasatya Khadka',  role: 'Chief Medical Advisor', initials: 'NK', bio: 'USA experience in internal medicine, Bir Hospital and Community Care. Passionate about making specialist-grade care accessible at home.' },
  { name: 'Sachita Budhathoki, BSN', role: 'Chief Nursing Advisor', initials: 'SB', bio: 'Former charge nurse at TU Teaching Hospital, with a decade of experience in home-based care models across South Asia and USA.' },
  { name: 'Dasra Khadka, Principal Engineer', role: 'Technology Advisor',              initials: 'DK', bio: 'AI expert with experience across various roles in technology companies in the U.S. and Kathmandu. Advised on building the AI-enabled Saathi Sneha Care app from the ground up.' },
  { name: 'Dr. Pooja KC',        role: 'Head of Care Delivery',       initials: 'PK', bio: 'Leads the team that connects every patient to the right services, labs, and specialists.' },
]

export default function AboutPage() {
  return (
    <div className="bg-white">

      {/* Header */}
      <section className="bg-brand-dark text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold mb-2">Founded for families left too far behind.</h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
            We exist because loving your parents from thousands of miles away is not enough. They need someone there, every day.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-6 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              In 2025, our founder finally came home to Kathmandu after five long years in the US. He&apos;d imagined this moment for months, the smell of his mother&apos;s kitchen, her voice calling his name. But when he stepped through her door, something made him stop cold. There, on the kitchen table, sat a worn notebook, its pages filled with glucose readings she&apos;d been recording by hand, night after night. Her medicines were running low. All this time, she had been quietly carrying the weight alone, checking her own sugar levels, rationing her pills, never once mentioning it in their weekly calls. She hadn&apos;t wanted to worry him.
            </p>
            <p>
              That night, he sat beside her and asked why she&apos;d never said anything. She simply smiled and said, &ldquo;You had your own life to build. I didn&apos;t want to be a burden.&rdquo; Her words stayed with him long after he flew back. He kept thinking about the millions of other parents like her, aging alone while their children built lives abroad, quietly managing illnesses, loneliness, and fear, all to spare their children a moment&apos;s worry.
            </p>
            <p>
              That&apos;s when the idea for Saathi was born. Not as a business, but as a promise - that no parent should have to hide their struggles out of love, and no child should have to learn the truth from a worn notebook on a kitchen table. Saathi exists so that care can travel the distance that we cannot, so that families separated by oceans can still feel close, still feel present, still feel like family.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-6 bg-brand-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-bold text-brand-dark mb-4">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-4 border border-brand-border flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-red" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-dark text-sm mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-6 bg-brand-red text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-lg font-bold mb-1">Join the Saathi Sneha Care family</h2>
          <p className="text-white/80 text-sm mb-4">Whether you need care for your parents today or are planning ahead, we are here to help.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-brand-red px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">
            Talk to Our Team <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

    </div>
  )
}
