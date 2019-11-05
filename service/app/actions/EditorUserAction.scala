/*
 *   Copyright (c) 2018, EPFL/Human Brain Project PCO
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package actions

import models.user.{EditorUserRequest, IDMUser}
import models.{user, UserRequest}
import play.api.Logger
import play.api.mvc.Results._
import play.api.mvc._
import services.EditorUserService

import scala.concurrent.{ExecutionContext, Future}

object EditorUserAction {
  val logger = Logger(this.getClass)
  implicit val scheduler = monix.execution.Scheduler.Implicits.global

  def editorUserAction(
    editorUserService: EditorUserService
  )(implicit ec: ExecutionContext): ActionRefiner[UserRequest, EditorUserRequest] =
    new ActionRefiner[UserRequest, EditorUserRequest] {
      def executionContext: ExecutionContext = ec

      def refine[A](input: UserRequest[A]): Future[Either[Result, EditorUserRequest[A]]] =
        editorUserService
          .getUser(input.user, input.userToken)
          .map {
            case Right(Some(editorUser)) => Right(user.EditorUserRequest(editorUser, input, input.userToken))
            case Right(None)             => Left(NotFound("User not found"))
            case Left(err) =>
              logger.error(s"Fetching editor user failed - ${err.content}")
              Left(InternalServerError("An error occurred while fetching user information"))
          }
          .runToFuture
    }

  def isCurator(user: IDMUser, org: String): Boolean = {
    val pattern = """^(.+)editorsug$""".r
    val curatorOrg = org match {
      case pattern(o) => o
      case _          => org
    }
    // Nexus curator a super group of other curator groups
    user.groups.exists(g => g.name.equals("nexus-curators") || g.name.matches(s"^nexus-$curatorOrg-curator$$"))
  }

  def curatorUserAction(org: String)(implicit ec: ExecutionContext): ActionFilter[EditorUserRequest] =
    new ActionFilter[EditorUserRequest] {
      def executionContext: ExecutionContext = ec

      def filter[A](input: EditorUserRequest[A]): Future[Option[Result]] =
        Future.successful(if (isCurator(input.editorUser.user, org)) {
          None
        } else {
          Some(Forbidden("You do not have sufficient access rights to proceed"))
        })
    }
}
