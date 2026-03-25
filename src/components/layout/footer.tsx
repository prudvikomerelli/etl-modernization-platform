export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">ET</span>
              </div>
              <span className="font-bold text-lg text-gray-900">ETL Platform</span>
            </div>
            <p className="text-sm text-gray-500">
              Transform legacy ETL pipelines into modern cloud-native workflows.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-gray-900">Features</a></li>
              <li><a href="#platforms" className="hover:text-gray-900">Platforms</a></li>
              <li><a href="#pricing" className="hover:text-gray-900">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="/docs" className="hover:text-gray-900">Documentation</a></li>
              <li><a href="/docs" className="hover:text-gray-900">API Reference</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
              <li><a href="#" className="hover:text-gray-900">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} ETL Modernization Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
