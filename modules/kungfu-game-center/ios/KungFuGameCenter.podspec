Pod::Spec.new do |s|
  s.name = 'KungFuGameCenter'
  s.version = '1.0.0'
  s.summary = 'Game Center achievements for Kung Fu Fisher'
  s.description = s.summary
  s.license = { :type => 'Proprietary' }
  s.author = 'Mablic'
  s.homepage = 'https://tradepartner.fyi/kungfu-fisher'
  s.platform = :ios, '16.4'
  s.swift_version = '5.9'
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'GameKit', 'UIKit'
  s.source_files = '**/*.swift'
end
