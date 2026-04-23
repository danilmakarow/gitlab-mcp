import { Module } from '@nestjs/common';

import { BranchesService } from './services/branches.service';
import { CommitsService } from './services/commits.service';
import { GitlabApiService } from './services/gitlab-api.service';
import { MergeRequestsService } from './services/merge-requests.service';
import { PipelinesService } from './services/pipelines.service';
import { ProjectsService } from './services/projects.service';

@Module({
  providers: [
    GitlabApiService,
    ProjectsService,
    BranchesService,
    CommitsService,
    MergeRequestsService,
    PipelinesService,
  ],
  exports: [
    ProjectsService,
    BranchesService,
    CommitsService,
    MergeRequestsService,
    PipelinesService,
  ],
})
export class GitlabModule {}
