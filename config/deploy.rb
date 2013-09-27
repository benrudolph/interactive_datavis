require 'bundler/capistrano'
require "capistrano-rbenv"
set :rbenv_ruby_version, "1.9.3-p392"

set :application, "student-surveys"
set :repository,  "git@github.com:benrudolph/interactive_datavis.git"
set :scm, :git
set :deploy_via, :remote_cache
set :user, :root
require '/Users/benrudolph/Dropbox/credientials/capcreds.rb'
set :deploy_to, "/var/www/#{application}"
set :use_sudo, false

# set :scm, :git # You can set :scm explicitly or Capistrano will make an intelligent guess based on known version control directory names
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none`

role :web, "176.58.105.165"
role :app, "176.58.105.165"                          # This may be the same as your `Web` server

set :ssh_options, { :forward_agent => true }

set :default_environment, {
  'PATH' => "$HOME/.rbenv/shims:$HOME/.rbenv/bin:$PATH"
}
# if you want to clean up old releases on each deploy uncomment this:
# after "deploy:restart", "deploy:cleanup"

# if you're still using the script/reaper helper you will need
# these http://github.com/rails/irs_process_scripts

# If you are using Passenger mod_rails uncomment this:
# namespace :deploy do
#   task :start do ; end
#   task :stop do ; end
#   task :restart, :roles => :app, :except => { :no_release => true } do
#     run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
#   end
# end
