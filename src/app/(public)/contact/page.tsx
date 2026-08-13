import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MapPin, Clock, MessageCircle, Facebook, Instagram } from 'lucide-react'
import { WHATSAPP_NUMBER, FACEBOOK_PAGE_USERNAME, INSTAGRAM_USERNAME } from '@/lib/constants'
import ContactForm from './contact-form'

export const metadata: Metadata = {
  title: 'Contact Us | Saathi Sneha Care',
  description: 'Reach out to our care team. We respond within 24 hours and can schedule calls across any timezone.',
}

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-brand-surface border-b border-brand-border py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold text-brand-red uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="text-4xl md:text-5xl font-bold text-brand-dark mb-4">Start a Conversation</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Tell us about your family. Our care team will reach out within 24 hours to discuss the right plan.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Contact info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-brand-dark mb-4">Contact Details</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-dark">Chat with Us</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMBER}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-red"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                        <a
                          href={`https://m.me/${FACEBOOK_PAGE_USERNAME}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-red"
                        >
                          <Facebook className="w-3.5 h-3.5" />
                          Messenger
                        </a>
                        <a
                          href={`https://ig.me/m/${INSTAGRAM_USERNAME}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-red"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          Instagram
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-dark">Office</p>
                      <p className="text-sm text-gray-500">Kathmandu, Nepal<br />Serving all major cities</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-dark">Response Time</p>
                      <p className="text-sm text-gray-500">Within 24 hours<br />Emergency line available 24/7</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-brand-surface rounded-2xl p-5 border border-brand-border">
                <p className="text-sm font-semibold text-brand-dark mb-2">Calling from abroad?</p>
                <p className="text-sm text-gray-500">We work across all timezones. Tell us when you are free and we will make it work, whether you are in the US, UK, Australia, the Gulf, or anywhere else in the world.</p>
              </div>
            </div>

            {/* Form — needs Suspense because it reads searchParams */}
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="h-96 rounded-2xl bg-gray-50 md:animate-pulse" />}>
                <ContactForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
