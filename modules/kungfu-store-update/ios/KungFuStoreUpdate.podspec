Pod::Spec.new do |s|
  s.name = 'KungFuStoreUpdate'
  s.version = '1.0.0'
  s.summary = 'Store update checks for Kung Fu Fisher'
  s.license = { :type => 'Proprietary' }
  s.author = 'Mablic'
  s.homepage = 'https://tradepartner.fyi/kungfu-fisher'
  s.platform = :ios, '16.4'
  s.source = { :git => '' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'StoreKit'
  s.source_files = '**/*.swift'
end
