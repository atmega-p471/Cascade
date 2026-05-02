/**
 * Достижение: грамота, статья, конкурс и т.д.
 * @typedef {'certificate' | 'article' | 'competition'} AchievementKind
 */

export class Achievement {
  /**
   * @param {object} data
   * @param {string} data.id
   * @param {string} data.userId
   * @param {AchievementKind} data.kind
   * @param {string} data.title
   * @param {string} [data.description]
   * @param {string} [data.level] — уровень (ВАК, Scopus, региональный и т.д.)
<<<<<<< HEAD
   * @param {string} [data.place] — результат участия (Победитель, Призёр, Участник)
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
   * @param {string} [data.issueDate]
   * @param {string} [data.articleUrl]
   * @param {string} [data.fileName]
   * @param {string} [data.fileDataUrl] — data URL для предпросмотра (только мок)
   * @param {number} [data.points] — начисленные баллы (для расчёта)
   */
  constructor({
    id,
    userId,
    kind,
    title,
    description = "",
    level = "",
<<<<<<< HEAD
    place = "",
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
    issueDate = "",
    articleUrl = "",
    fileName = "",
    fileDataUrl = "",
    points = 0,
  }) {
    this.id = id;
    this.userId = userId;
    this.kind = kind;
    this.title = title;
    this.description = description;
    this.level = level;
<<<<<<< HEAD
    this.place = place;
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
    this.issueDate = issueDate;
    this.articleUrl = articleUrl;
    this.fileName = fileName;
    this.fileDataUrl = fileDataUrl;
    this.points = points;
  }
}
