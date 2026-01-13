import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-(--surface) text-(--secondary-text) text-sm">
      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0">
        {/* Column 1: Quick Links */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-(--secondary-text) mb-2">Quick Links</h4>
          <Link href="/" className="hover:text-(--accent) transition">
            Home
          </Link>
          <Link href="/pages/resources" className="hover:text-(--accent) transition">
            Resources
          </Link>
          <Link href="/pages/news" className="hover:text-(--accent) transition">
            News
          </Link>
          <Link href="/pages/about" className="hover:text-(--accent) transition">
            About
          </Link>
        </div>

        {/* Column 2: Hours */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-(--secondary-text) mb-2">Hours of Operation</h4>
          <span>Mon-Fri: 9:00 AM - 8:00 PM</span>
          <span>Sat: 10:00 AM - 6:00 PM</span>
          <span>Sun: 11:00 AM - 4:00 PM</span>
        </div>

        {/* Column 3: Find Us */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h4 className="font-semibold text-(--secondary-text) mb-2">Find Us</h4>
          <div className="w-full md:w-64 h-36 rounded-lg overflow-hidden border border-(--border)">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3021.8088355511874!2d-74.0142912845943!3d40.70956994511227!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a197fd0e3f3%3A0x482cdd582cb4c6af!2s101%20Liberty%20St%2C%20New%20York%2C%20NY%2010007%2C%20USA!5e0!3m2!1sen!2sus!4v1695041045182!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-(--border) bg-(--surface) py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-(--secondary-text) text-sm">
          <img src="/main_logo.png" alt="NaviHub Logo" className="h-10 mb-2 md:mb-0" />
          <span>© 2026 TSA Webmaster All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
