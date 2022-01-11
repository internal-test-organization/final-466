const fs = require('fs')
  , path = require('path')
  , core = require('@actions/core')
  , io = require('@actions/io')
  , json2csv = require('json2csv')
  , github = require('@actions/github')
  , githubClient = require('./src/githublib/githubClient')
  , OrganizationActivity = require('./src/OrgsUserActivity')
  , Organization = require('./src/githublib/Organization')
;

async function run() {
  const token = core.getInput('token')
    , outputDir = core.getInput('outputDir')
    , organizationinp = core.getInput('organization')
    , maxRetries = core.getInput('octokit_max_retries')
  ;
console.log(organizationinp)
let regex = /^[\w\.\_\-]+((,|-)[\w\.\_\-]+)*[\w\.\_\-]+$/g;
let validate_org = regex.test(organizationinp);
if((!validate_org)) {
  throw new Error('Provide a valid organization - It accept only comma separated value');
}

let sinceregex = /^(20)\d\d-(0[1-9]|1[012])-([012]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/ 
;

await io.mkdirP(outputDir)

const octokit = githubClient.create(token, maxRetries)
  , orgActivity = new OrganizationActivity(octokit)
  , orgActivity1 = new Organization(octokit)
;



//***start */
let organizationlist = organizationinp.split(',');
let OrgSecret = [];
let repos = [];
let members = [];
let finaloutput = [];
let orgrepo = [];

console.log(organizationlist)
for(const organization of organizationlist){
  console.log(`Attempting to generate ${organization} - user activity data, this could take some time...`);
  const orgsComments = await orgActivity.getOrgsValid(organization);
  if(orgsComments.status !== 'error') {
       
       //member = await orgActivity1.getOrgMembers(organization);
       orgrepos = await orgActivity1.getOrgRepositories(organization);
  
       console.log(orgrepo);
       
       orgrepos.map(({name}) => {
        console.log(name)
        orgrepo.push(name);
     })
     
     
     let secretlist = [];
     for(const orepo  of orgrepo){
            repos = await orgActivity1.getOrgRepoSecret(organization,orepo);
            repos.map(({name}) =>{
              console.log(name)
              orreposecret.push(name);
            })
            secrets = await orgActivity1.getOrgSecrets(organization);
            secrets.map(({name}) => {
              console.log(name)
              orgsecret.push(name);
            })
            if ( orgsecret == orreposecret) {
                repoconts = await orgActivity1.getRepoContributor(organization,orepo)
                repoconts.map(({name}) =>{
                  console.log(name)
                  repocont.push(name);
                })
            }
      }
      for( const repo of repos) {
        finaloutput.push({name:repo.name,maintainer:repocont.name,"org-secrets-overriden":secrets.name,message:"org secrets overriden"})
      }
  }
} 
saveIntermediateData(outputDir, finaloutput);


function saveIntermediateData(directory, data) {
  try {
    const file = path.join(directory, 'org-overriden-secret.json');
    fs.writeFileSync(file, JSON.stringify(data));
    core.setOutput('report_json', file);
  } catch (err) {
    console.error(`Failed to save intermediate data: ${err}`);
  }
}

core.setOutput('repos', repos);
core.setOutput('secret',secrets);
core.setOutput('report',finaloutput);
}

run();