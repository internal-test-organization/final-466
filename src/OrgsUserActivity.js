const Organization = require('./githublib/Organization');

module.exports = class OrganizationActivity {

  constructor(octokit) {
    this._organization = new Organization(octokit);
  }

  get organizationClient() {
    return this._organization;
  }
  
    async getOrgsValid (org) {
        const self = this;
        const orgsValid = await self.organizationClient.getOrgs(org);
    
        return orgsValid;
        
      }
}