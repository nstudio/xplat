<% if (!onlyProject && !ignoreBase && !onlyModule) { %>export * from './base';<% } %>
export * from './<%= name %>.module';
