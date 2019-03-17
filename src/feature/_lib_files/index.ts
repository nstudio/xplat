<% if (!onlyProject && createBase && !onlyModule) { %>export * from './base';<% } %>
export * from './<%= name %>.module';
